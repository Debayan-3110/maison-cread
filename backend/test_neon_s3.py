import boto3
import os
from botocore.client import Config

# Read env vars or set directly
AWS_ACCESS_KEY_ID = "nak_live_f7deee1339fc4ab595a728e4d917fb06"
AWS_SECRET_ACCESS_KEY = "nsk_live_001fd5fb91ebf752d16518f3b1349001d736597bd42a0058c31e54ee5fd4e5bf"
AWS_ENDPOINT_URL_S3 = "https://br-billowing-dream-b3s5htej.storage.c-4.ap-southeast-1.aws.neon.tech"
AWS_REGION = "ap-southeast-1"
BUCKET = "assets"

s3 = boto3.client(
    's3',
    endpoint_url=AWS_ENDPOINT_URL_S3,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
    config=Config(s3={'addressing_style': 'path'}, signature_version='s3v4')
)

# Test listing buckets
print("Listing buckets...")
buckets = s3.list_buckets()
print("Buckets:", [b['Name'] for b in buckets.get('Buckets', [])])

# Test putting an object
test_key = "test/welcome.txt"
test_content = b"Welcome to Maison Cread on Neon Object Storage!"
print(f"Uploading {test_key} to bucket {BUCKET}...")
s3.put_object(Bucket=BUCKET, Key=test_key, Body=test_content, ContentType="text/plain")
print("Upload successful!")

# Test getting the object
print(f"Downloading {test_key}...")
res = s3.get_object(Bucket=BUCKET, Key=test_key)
body = res['Body'].read().decode('utf-8')
print("Downloaded content:", body)

# Test presigned URL
url = s3.generate_presigned_url('get_object', Params={'Bucket': BUCKET, 'Key': test_key}, ExpiresIn=3600)
print("Presigned URL:", url[:80] + "...")

