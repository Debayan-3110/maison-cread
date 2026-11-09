"""
Neon PostgreSQL Shipment, Warehouse & Local Store Tracking Service
===================================================================
Provides high-performance queryable access to:
- Neon `warehouses` (Regional hubs & cryogenic vault custody)
- Neon `local_stores` (Partner boutiques & atelier waypoints)
- Neon `shipments` (Full high-assurance tracking telemetry)

With fallback to local SQLite synchronization for offline resilience.
"""
import os
import json
import time
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV)

DATABASE_URL = os.getenv("DATABASE_URL")

def get_neon_conn():
    """Returns a connection to Neon PostgreSQL if available."""
    if not DATABASE_URL:
        return None
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"[Neon Shipment Service] Connection error: {e}")
        return None

def query_neon_shipment(tracking_number_or_id: str) -> Optional[Dict[str, Any]]:
    """Queries Neon PostgreSQL for a shipment by tracking number or order ID."""
    clean_id = (tracking_number_or_id or "").strip()
    if not clean_id:
        return None

    conn = get_neon_conn()
    if not conn:
        return None

    try:
        with conn.cursor() as cur:
            query = """
            SELECT 
                s.*,
                w.name AS warehouse_name,
                w.code AS warehouse_code,
                w.address AS warehouse_address,
                w.city AS warehouse_city,
                w.country AS warehouse_country,
                w.latitude AS warehouse_lat,
                w.longitude AS warehouse_lng,
                w.security_level AS warehouse_security,
                ls.name AS store_name,
                ls.store_code AS store_code,
                ls.category AS store_category,
                ls.address AS store_address,
                ls.city AS store_city,
                ls.latitude AS store_lat,
                ls.longitude AS store_lng,
                ls.operating_hours AS store_operating_hours,
                ls.phone AS store_phone,
                ls.manager_name AS store_manager
            FROM shipments s
            LEFT JOIN warehouses w ON s.origin_warehouse_id = w.id
            LEFT JOIN local_stores ls ON s.assigned_local_store_id = ls.id
            WHERE s.tracking_number = %s OR s.id = %s OR s.order_id = %s OR s.tracking_number ILIKE %s OR s.order_id ILIKE %s
            LIMIT 1;
            """
            cur.execute(query, (clean_id, clean_id, clean_id, f"%{clean_id}%", f"%{clean_id}%"))
            row = cur.fetchone()
            if not row:
                return None

            result = dict(row)
            # Normalize JSON fields
            if isinstance(result.get("items_json"), str):
                try:
                    result["items"] = json.loads(result["items_json"])
                except Exception:
                    result["items"] = []
            else:
                result["items"] = result.get("items_json") or []

            if isinstance(result.get("timeline_json"), str):
                try:
                    result["timeline"] = json.loads(result["timeline_json"])
                except Exception:
                    result["timeline"] = []
            else:
                result["timeline"] = result.get("timeline_json") or []

            # Format coordinates as floats
            for key in ["destination_lat", "destination_lng", "current_latitude", "current_longitude", "warehouse_lat", "warehouse_lng", "store_lat", "store_lng"]:
                if result.get(key) is not None:
                    try:
                        result[key] = float(result[key])
                    except Exception:
                        pass

            result["origin_source"] = "neon_postgresql"
            return result
    except Exception as err:
        print(f"[Neon Shipment Service] Error querying Neon: {err}")
        return None
    finally:
        try:
            conn.close()
        except Exception:
            pass

def list_neon_shipments(limit: int = 50, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns shipments from Neon PostgreSQL."""
    conn = get_neon_conn()
    if not conn:
        return []

    try:
        with conn.cursor() as cur:
            if status:
                cur.execute("""
                SELECT s.*, w.name as warehouse_name, ls.name as store_name
                FROM shipments s
                LEFT JOIN warehouses w ON s.origin_warehouse_id = w.id
                LEFT JOIN local_stores ls ON s.assigned_local_store_id = ls.id
                WHERE s.status = %s
                ORDER BY s.created_at DESC LIMIT %s;
                """, (status, limit))
            else:
                cur.execute("""
                SELECT s.*, w.name as warehouse_name, ls.name as store_name
                FROM shipments s
                LEFT JOIN warehouses w ON s.origin_warehouse_id = w.id
                LEFT JOIN local_stores ls ON s.assigned_local_store_id = ls.id
                ORDER BY s.created_at DESC LIMIT %s;
                """, (limit,))
            rows = cur.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                if isinstance(d.get("items_json"), str):
                    try:
                        d["items"] = json.loads(d["items_json"])
                    except Exception:
                        d["items"] = []
                else:
                    d["items"] = d.get("items_json") or []
                results.append(d)
            return results
    except Exception as err:
        print(f"[Neon Shipment Service] Error listing shipments: {err}")
        return []
    finally:
        try:
            conn.close()
        except Exception:
            pass

def list_neon_warehouses() -> List[Dict[str, Any]]:
    """Returns all regional warehouses and vaults from Neon."""
    conn = get_neon_conn()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM warehouses ORDER BY name ASC;")
            rows = cur.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                if d.get("latitude"): d["latitude"] = float(d["latitude"])
                if d.get("longitude"): d["longitude"] = float(d["longitude"])
                results.append(d)
            return results
    except Exception as err:
        print(f"[Neon Shipment Service] Error fetching warehouses: {err}")
        return []
    finally:
        try:
            conn.close()
        except Exception:
            pass

def list_neon_local_stores(city: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns partner boutiques and ateliers from Neon."""
    conn = get_neon_conn()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            if city:
                cur.execute("SELECT * FROM local_stores WHERE city ILIKE %s ORDER BY name ASC;", (f"%{city}%",))
            else:
                cur.execute("SELECT * FROM local_stores ORDER BY name ASC;")
            rows = cur.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                if d.get("latitude"): d["latitude"] = float(d["latitude"])
                if d.get("longitude"): d["longitude"] = float(d["longitude"])
                if d.get("rating"): d["rating"] = float(d["rating"])
                results.append(d)
            return results
    except Exception as err:
        print(f"[Neon Shipment Service] Error fetching local stores: {err}")
        return []
    finally:
        try:
            conn.close()
        except Exception:
            pass

def sync_order_to_shipment_in_neon(order_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Creates or synchronizes an order into the Neon `shipments` table.
    Links the closest warehouse and registered boutique store.
    """
    conn = get_neon_conn()
    if not conn:
        return None

    try:
        order_id = order_dict.get("id") or order_dict.get("orderId")
        shipping = order_dict.get("shipping") or order_dict.get("shippingInfo") or {}
        items = order_dict.get("items") or []
        summary = order_dict.get("summary") or {}

        tracking_num = f"SHP-{order_id.replace('MC-ORD-', '')}" if "MC-ORD-" in order_id else f"SHP-{order_id}"
        customer_name = shipping.get("fullName") or "Maison Client"
        customer_email = shipping.get("email")
        customer_phone = shipping.get("phone")
        
        address_parts = [shipping.get("address"), shipping.get("city"), shipping.get("state"), shipping.get("zipCode"), shipping.get("country")]
        delivery_address = ", ".join([p for p in address_parts if p]) or "Maison Client Residence"
        dest_city = shipping.get("city") or "Paris"

        dest_lat = float(order_dict.get("deliveryLat") or shipping.get("latitude") or 48.8698)
        dest_lng = float(order_dict.get("deliveryLng") or shipping.get("longitude") or 2.3204)

        # Default nearest warehouse and store assignment based on city
        city_lower = dest_city.lower()
        if "london" in city_lower:
            wh_id, store_id = "WH-LONDON-01", "STORE-BOND-01"
            curr_lat, curr_lng = 51.4920, -0.2100
            curr_loc = "M4 Mayfair Inbound Transit Escrow"
        elif "tokyo" in city_lower:
            wh_id, store_id = "WH-TOKYO-01", "STORE-GINZA-01"
            curr_lat, curr_lng = 35.6800, 139.7700
            curr_loc = "Chuo Expressway Cyber Logistics Lane"
        elif "bengaluru" in city_lower or "bangalore" in city_lower or "india" in city_lower:
            wh_id, store_id = "WH-BLR-01", "STORE-UB-01"
            curr_lat, curr_lng = 13.0500, 77.6200
            curr_loc = "Bellary Road Armored Escort Corridor"
        elif "new york" in city_lower:
            wh_id, store_id = "WH-NY-01", "STORE-MADISON-01"
            curr_lat, curr_lng = 40.7300, -73.9800
            curr_loc = "Midtown Armored Secured Waypoint"
        else:
            wh_id, store_id = "WH-PARIS-01", "STORE-VENDOME-01"
            curr_lat, curr_lng = 48.8685, 2.3245
            curr_loc = "Rue Royale Courier Transit Lane, Paris"

        now = datetime.now(timezone.utc)
        timeline = [
            {
                "step": 1,
                "stage": "order_confirmed",
                "title": "Order Placed & Escrow Validated",
                "location": "Maison Cloud Infrastructure Gateway",
                "timestamp": now.isoformat(),
                "status": "completed",
                "details": f"Order #{order_id} recorded in Neon sovereign ledger."
            },
            {
                "step": 2,
                "stage": "warehouse_allocated",
                "title": "Central Vault Custody Allocation",
                "location": f"Warehouse Hub ({wh_id})",
                "timestamp": now.isoformat(),
                "status": "completed",
                "details": "Allocated from Cryo-Vault Chamber. Cold-chain seal active."
            },
            {
                "step": 3,
                "stage": "vault_authenticated",
                "title": "Forensic Inspection & Tamper Seal",
                "location": "Maison Certification Desk",
                "timestamp": now.isoformat(),
                "status": "completed",
                "details": f"Digital certificate generated. Holographic seal #SEAL-{order_id[-5:]} attached."
            },
            {
                "step": 4,
                "stage": "dispatched_transit",
                "title": "Armored High-Security Transit",
                "location": curr_loc,
                "timestamp": now.isoformat(),
                "status": "active",
                "details": "High-security transport vehicle en route to local atelier partner."
            },
            {
                "step": 5,
                "stage": "store_received",
                "title": "Partner Boutique Waypoint Check-In",
                "location": f"Local Store ({store_id})",
                "timestamp": None,
                "status": "pending",
                "details": "Pending arrival and authentication scan by boutique master."
            },
            {
                "step": 6,
                "stage": "out_for_delivery",
                "title": "Out for Hand-to-Hand Delivery",
                "location": delivery_address,
                "timestamp": None,
                "status": "pending",
                "details": "Assigned white-glove courier final delivery."
            }
        ]

        with conn.cursor() as cur:
            cur.execute("""
            INSERT INTO shipments (
                id, tracking_number, order_id, customer_name, customer_email, customer_phone,
                delivery_address, destination_city, destination_lat, destination_lng,
                origin_warehouse_id, assigned_local_store_id, carrier_name, carrier_license,
                courier_name, courier_phone, current_latitude, current_longitude,
                current_location_name, status, tamper_seal_id, temperature_celsius,
                estimated_delivery, items_json, timeline_json, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                current_latitude = EXCLUDED.current_latitude,
                current_longitude = EXCLUDED.current_longitude,
                current_location_name = EXCLUDED.current_location_name,
                timeline_json = EXCLUDED.timeline_json,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
            """, (
                tracking_num,
                tracking_num,
                order_id,
                customer_name,
                customer_email,
                customer_phone,
                delivery_address,
                dest_city,
                dest_lat,
                dest_lng,
                wh_id,
                store_id,
                "Maison Armored White-Glove Transit",
                "ARMOR-SEC-09",
                "Claude Delacroix",
                "+33 6 88 12 34 56",
                curr_lat,
                curr_lng,
                curr_loc,
                "dispatched_transit",
                f"SEAL-{order_id[-5:]}",
                18.2,
                (now + timedelta(hours=3)).isoformat(),
                json.dumps(items),
                json.dumps(timeline)
            ))
            row = cur.fetchone()
            return dict(row) if row else None
    except Exception as err:
        print(f"[Neon Shipment Service] Error syncing order to shipment in Neon: {err}")
        return None
    finally:
        try:
            conn.close()
        except Exception:
            pass

def get_complete_shipment(tracking_number_or_id: str) -> Optional[Dict[str, Any]]:
    """
    Main entry point: fetches shipment from Neon, falling back to SQLite order synthesis
    so that EVERY order in the database is 100% trackable.
    """
    clean_id = (tracking_number_or_id or "").strip()
    if not clean_id:
        return None

    # 1. First attempt: Query Neon PostgreSQL
    neon_res = query_neon_shipment(clean_id)
    if neon_res:
        return neon_res

    # 2. Second attempt: Query local database order and synthesize complete shipment
    from backend.database import get_order_by_id
    order = get_order_by_id(clean_id)
    if order:
        # Sync this order into Neon shipments so it exists in Neon
        synced = sync_order_to_shipment_in_neon(order)
        if synced:
            return query_neon_shipment(clean_id) or synced

        # Fallback synthesis if Neon is unreachable
        shipping = order.get("shipping") or order.get("shippingInfo") or {}
        items = order.get("items") or []
        timeline = order.get("trackingTimeline") or []
        address = order.get("delivery_address") or "Client Private Address"
        
        return {
            "id": f"SHP-{order['id'].replace('MC-ORD-', '')}",
            "tracking_number": f"SHP-{order['id'].replace('MC-ORD-', '')}",
            "order_id": order["id"],
            "customer_name": shipping.get("fullName") or "Maison Client",
            "customer_email": shipping.get("email"),
            "customer_phone": shipping.get("phone"),
            "delivery_address": address,
            "destination_city": shipping.get("city") or "Paris",
            "destination_lat": float(order.get("delivery_lat") or 48.8698),
            "destination_lng": float(order.get("delivery_lng") or 2.3204),
            "warehouse_name": "Maison Central Cryo-Vault, Paris",
            "warehouse_code": "WH-CDG-PAR",
            "warehouse_address": "Zone de Fret 4, Aéroport CDG, Paris",
            "warehouse_security": "Tier 4 High-Assurance Vault",
            "store_name": order.get("assigned_shop_name") or "Maison de l'Horlogerie — Place Vendôme",
            "store_address": "12 Place Vendôme, 75001 Paris",
            "carrier_name": "Maison Armored White-Glove Transit",
            "carrier_license": "ARMOR-FR-782",
            "courier_name": "Jean-Luc Moreau",
            "courier_phone": "+33 6 98 76 54 32",
            "current_latitude": float(order.get("delivery_lat") or 48.8685),
            "current_longitude": float(order.get("delivery_lng") or 2.3245),
            "current_location_name": "Faubourg Saint-Honoré Diplomatic Transit Corridor",
            "status": order.get("status") or "dispatched_transit",
            "tamper_seal_id": f"SEAL-{order['id'][-5:]}",
            "temperature_celsius": 18.2,
            "estimated_delivery": order.get("estimated_delivery") or "Instant White-Glove Courier",
            "items": items,
            "timeline": timeline,
            "origin_source": "sqlite_fallback_synced"
        }

    return None
