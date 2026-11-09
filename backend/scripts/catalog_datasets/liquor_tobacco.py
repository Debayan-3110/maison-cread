"""
Liquor, Spirits, Fine Cigars & Tobacco Dataset (110 Items: 55 Imported + 55 Domestic)
100% Unique Titles, 100% Unique Image URLs.
Strict 18+ Statutory Age-Gated Luxury Spirits, Indian Single Malts, Cuban Habanos & Craft Distillations.
"""

# ==========================================
# 55 IMPORTED LUXURY SPIRITS & CIGARS
# ==========================================
IMPORTED_ITEMS = [
    # --- Imported Single Malts, Japanese & World Whiskies (18 Items) ---
    ("The Macallan 18 Year Old Double Cask Highland Single Malt Scotch",
     "Matured for 18 years in a combination of handpicked American and European oak sherry-seasoned casks from Jerez, Spain.",
     42000, 48000, "The Macallan", "imported-whisky", "1527281400680-8598f3583b3a_macallan18",
     ["liquor", "imported", "scotch", "single-malt", "macallan", "18-years", "whisky"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Speyside, Scotland", "ABV": "43.0%", "Age": "18 Years Old Sherry Cask", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Lagavulin 16 Year Old Islay Single Malt Scotch Whisky",
     "The definitive Islay peated malt boasting thick peat smoke, dry sea salt, sweet vanilla, and intense lingering oak richness.",
     13500, 16000, "Lagavulin Distillery", "imported-whisky", "1514432324607-a09d9b4aefdd_lagavulin16",
     ["liquor", "imported", "islay", "single-malt", "peated-whisky", "lagavulin", "scotch"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Islay, Scotland", "ABV": "43.0%", "Age": "16 Years", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Yamazaki 12 Year Old Suntory Japanese Single Malt Whisky",
     "Pioneering Japanese whisky matured in Mizunara Japanese oak with delicate notes of peach, pineapple, candied orange, and sandalwood.",
     28500, 34000, "Suntory Yamazaki", "imported-whisky", "1527281400680-8598f3583b3a_yamazaki12",
     ["liquor", "imported", "japanese-whisky", "yamazaki", "suntory", "single-malt", "mizunara"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Osaka, Japan", "ABV": "43.0%", "Age": "12 Years in Mizunara & Sherry Casks", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Hibiki Japanese Harmony Blended Whisky Suntory",
     "A meticulous blend of malt and grain whiskies from Yamazaki, Hakushu, and Chita presented in a 24-faceted crystal bottle.",
     16800, 19999, "Suntory Hibiki", "imported-whisky", "1514432324607-a09d9b4aefdd_hibikiharmony",
     ["liquor", "imported", "hibiki", "japanese-whisky", "suntory", "harmony", "blended-whisky"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Japan", "ABV": "43.0%", "Bottle": "24 Facets Representing Japanese Seasons", "HSN": "2208", "Statutory_Age": "18+"}),

    ("The Balvenie 21 Year Old PortWood Finish Single Malt",
     "Rare malt transferred to port casks (pipes) that previously held fine tawny port wines, imparting creamy honeyed silkiness.",
     38990, 45000, "The Balvenie", "imported-whisky", "1527281400680-8598f3583b3a_balvenie21",
     ["liquor", "imported", "balvenie", "portwood", "single-malt", "speyside", "luxury-scotch"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Dufftown, Speyside, Scotland", "ABV": "40.0%", "Finish": "Aged 21 Years in Tawny Port Casks", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Glenfiddich 21 Year Old Gran Reserva Rum Cask Finish",
     "Matured in traditional oak casks for 21 years before being finished for four months in selected Caribbean rum casks.",
     24500, 29000, "Glenfiddich", "imported-whisky", "1514432324607-a09d9b4aefdd_glenfiddich21",
     ["liquor", "imported", "glenfiddich", "gran-reserva", "rum-cask", "single-malt", "scotch"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Speyside, Scotland", "ABV": "40.0%", "Finish": "Caribbean Rum Cask Matured", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Talisker 18 Year Old Isle of Skye Single Malt Scotch",
     "Rich and maritime with notes of sweet smoke, plum, toffee, and a fiery black pepper kick at the back of the palate.",
     19800, 23500, "Talisker Distillery", "imported-whisky", "1527281400680-8598f3583b3a_talisker18",
     ["liquor", "imported", "talisker", "isle-of-skye", "single-malt", "island-scotch", "smoky"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Carbost, Isle of Skye, Scotland", "ABV": "45.8%", "Awards": "World Whiskies Awards Best Single Malt", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Ardbeg Uigeadail Cask Strength Islay Single Malt",
     "Non-chill filtered high-proof Islay powerhouse marrying deep smoky peat with rich, sweet dried fruit notes from old ex-sherry butts.",
     12999, 15500, "Ardbeg Distillery", "imported-whisky", "1514432324607-a09d9b4aefdd_ardbeguigeadail",
     ["liquor", "imported", "ardbeg", "islay", "cask-strength", "peat-smoke", "sherry-cask"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Islay, Scotland", "ABV": "54.2% Cask Strength", "Profile": "Heavy Peat Smoke & Dark Fruit", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Hakushu 12 Year Old Japanese Mountain Forest Single Malt",
     "Crafted amidst lush mountain forests in Mt. Kaikomagatake with delicate herbal herbal aromas, green apple, and subtle smoke.",
     26500, 31000, "Suntory Hakushu", "imported-whisky", "1527281400680-8598f3583b3a_hakushu12",
     ["liquor", "imported", "hakushu", "japanese-whisky", "mountain-forest", "single-malt"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Southern Japanese Alps", "ABV": "43.0%", "Tasting Notes": "Pine Needle, Peppermint, Crisp Green Apple", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Johnnie Walker Blue Label Ghost and Rare Port Ellen Edition",
     "Masterful blend centered around irreplaceable single malts from the silent and ghost distillery of Port Ellen on Islay.",
     45000, 52000, "Johnnie Walker", "imported-whisky", "1514432324607-a09d9b4aefdd_blueghostrare",
     ["liquor", "imported", "johnnie-walker", "blue-label", "port-ellen", "ghost-distillery", "blended-scotch"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Scotland", "ABV": "43.8%", "Core Malt": "Ghost Distillery Port Ellen Closed 1983", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Glenmorangie Signet Bespoke High-Roast Chocolate Malt Scotch",
     "Distilled with heavily roasted chocolate malted barley and aged in designer toasted virgin oak casks for decadent espresso mocha notes.",
     27500, 32000, "Glenmorangie", "imported-whisky", "1527281400680-8598f3583b3a_glenmorangiesignet",
     ["liquor", "imported", "glenmorangie", "signet", "chocolate-malt", "highland-scotch"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Highlands, Scotland", "ABV": "46.0%", "Special Grain": "Heavily Roasted Chocolate Barleys", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Kavalan Solist Vinho Barrique Cask Strength Taiwanese Single Malt",
     "World Whiskies Awards winner matured in re-charred American oak wine casks under Taiwan's subtropical climate.",
     21999, 26000, "Kavalan Distillery", "imported-whisky", "1514432324607-a09d9b4aefdd_kavalansolist",
     ["liquor", "imported", "kavalan", "taiwan-whisky", "solist", "vinho-barrique", "cask-strength"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Yilan County, Taiwan", "ABV": "57.8% Single Cask", "Maturation": "STR Re-Charred Wine Barriques", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Bowmore 18 Year Old Islay Deep Dark Sherry Matured Single Malt",
     "Matured in hand-selected ex-bourbon and Oloroso sherry casks inside Bowmore's legendary Vaults below sea level.",
     18500, 22000, "Bowmore Distillery", "imported-whisky", "1527281400680-8598f3583b3a_bowmore18",
     ["liquor", "imported", "bowmore", "islay", "sherry-cask", "single-malt", "18-years"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Bowmore, Islay, Scotland", "ABV": "43.0%", "Vaults": "Aged in No. 1 Vaults Below Sea Level", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Highland Park 18 Year Old Viking Pride Single Malt Scotch",
     "Naturally colored malt using aromatic Hobbister Moor heather peat, aged in first-fill European oak sherry butts in Orkney.",
     22500, 26500, "Highland Park", "imported-whisky", "1514432324607-a09d9b4aefdd_highlandpark18",
     ["liquor", "imported", "highland-park", "viking-pride", "orkney", "single-malt", "heather-peat"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Kirkwall, Orkney Islands, Scotland", "ABV": "43.0%", "Peat": "Floral Heather Hobbister Moor Peat", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Nikka From The Barrel Double Matured Japanese Whisky (500ml)",
     "Complex blend of grain and malt whisky married in used casks for months and bottled directly at robust 51.4% cask strength.",
     8999, 10999, "Nikka Whisky Japan", "imported-whisky", "1527281400680-8598f3583b3a_nikkafromthebarrel",
     ["liquor", "imported", "nikka", "japanese-whisky", "cask-strength", "yoichi", "miyagikyo"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Japan", "ABV": "51.4% Heavy Cask Strength", "Style": "Re-Casked Double Matured Marriage", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Michter's US 1 Single Barrel 10 Year Old Kentucky Straight Bourbon",
     "Limited production fire-charred new American white oak aged bourbon delivering notes of rich maple syrup, toffee, and roasted pecan.",
     29500, 35000, "Michter's Distillery", "imported-whisky", "1514432324607-a09d9b4aefdd_michters10",
     ["liquor", "imported", "bourbon", "michters", "kentucky-straight", "single-barrel", "10-years"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Louisville, Kentucky, USA", "ABV": "47.2% (94.4 Proof)", "Barrel": "Fire-Charred New American White Oak", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Redbreast 21 Year Old Single Pot Still Irish Whiskey",
     "The finest expression of traditional Irish pot still whiskey aged in ex-bourbon and first-fill oloroso sherry butts.",
     32000, 38000, "Redbreast Midleton", "imported-whisky", "1527281400680-8598f3583b3a_redbreast21",
     ["liquor", "imported", "irish-whiskey", "redbreast", "single-pot-still", "21-years", "midleton"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "County Cork, Ireland", "ABV": "46.0%", "Style": "Malted & Unmalted Copper Pot Distillation", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Laphroaig 25 Year Old The Cask Strength Edition Single Malt",
     "A marriage of Laphroaig matured in second-fill European oak Oloroso sherry casks and ex-bourbon barrels for a quarter century.",
     68000, 78000, "Laphroaig Distillery", "imported-whisky", "1514432324607-a09d9b4aefdd_laphroaig25",
     ["liquor", "imported", "laphroaig", "islay", "cask-strength", "25-years", "rare-whisky"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Islay, Scotland", "ABV": "51.4%", "Aging": "25 Full Years in Atlantic Sea-Facing Cellars", "HSN": "2208", "Statutory_Age": "18+"}),

    # --- Imported Cognacs, Agave & Luxury Spirits (15 Items) ---
    ("Hennessy XO The Original Extra Old Cognac (700ml Decanter)",
     "Created in 1870 by Maurice Hennessy, blending over 100 eaux-de-vie aged up to 30 years with intense candied fruit and wild cocoa.",
     26500, 31000, "Hennessy Cognac", "imported-spirits", "1569529465840-7e4466b872be_hennessyxo",
     ["liquor", "imported", "cognac", "hennessy-xo", "french-brandy", "luxury-spirits"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Cognac, Charente, France", "ABV": "40.0%", "Decanter": "Signature Baccarat Fluted Carafe", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Remy Martin Louis XIII Grande Champagne Cognac (700ml Baccarat Crystal)",
     "The ultimate luxury cognac blended from up to 1,200 eaux-de-vie harvested exclusively from Grande Champagne and aged up to 100 years.",
     385000, 425000, "Remy Martin", "imported-spirits", "1569529465840-7e4466b872be_louisxiii",
     ["liquor", "imported", "cognac", "louis-xiii", "baccarat-crystal", "grande-champagne", "ultra-luxury"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Grande Champagne, Cognac, France", "ABV": "40.0%", "Decanter": "Handcrafted Individually Numbered Baccarat Crystal", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Dom Pérignon Vintage Champagne Brut (750ml Boxed)",
     "Prestige cuvée made exclusively from a single vintage year of Grand Cru Pinot Noir and Chardonnay grapes aged on lees for 8 years.",
     28000, 33000, "Moët & Chandon Dom Pérignon", "imported-spirits", "1558001375-7f3c4c92b028_domperignon",
     ["liquor", "imported", "champagne", "dom-perignon", "vintage-champagne", "french-wine", "grand-cru"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Épernay, Champagne, France", "ABV": "12.5%", "Aging": "Minimum 8 Years Sur Lie Aging", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Clase Azul Reposado Artisanal Ceramic Decanter Tequila (750ml)",
     "Crafted from 100% Blue Weber Agave, aged for 8 months in bourbon barrels and presented in a hand-painted cobalt ceramic decanter.",
     29500, 35000, "Clase Azul Mexico", "imported-spirits", "1569529465840-7e4466b872be_claseazul",
     ["liquor", "imported", "tequila", "clase-azul", "reposado", "hand-painted-ceramic", "agave"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Los Altos de Jalisco, Mexico", "ABV": "40.0%", "Bottle": "Individually Sculpted & Painted by Mazahua Artisans", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Don Julio 1942 Anejo Tequila Handcrafted (750ml Tall Bottle)",
     "Small-batch anejo tequila aged for a minimum of two and a half years in American white oak barrels with rich caramel vanilla notes.",
     24999, 29000, "Don Julio", "imported-spirits", "1569529465840-7e4466b872be_donjulio1942",
     ["liquor", "imported", "tequila", "don-julio-1942", "anejo", "jalisco", "luxury-tequila"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Atotonilco El Alto, Jalisco, Mexico", "ABV": "38.0%", "Aging": "30 Months in Ex-Bourbon White Oak", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Ron Zacapa Centenario 23 Solera Gran Reserva Rum",
     "Guatemalan virgin sugar cane honey rum aged in the 'House Above the Clouds' at 2,300 meters using a 4-tier solera system.",
     9800, 12000, "Ron Zacapa", "imported-spirits", "1569529465840-7e4466b872be_ronzacapa23",
     ["liquor", "imported", "rum", "ron-zacapa", "solera-23", "guatemala", "sugar-cane-honey"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Quetzaltenango, Guatemala (2,300m Altitude)", "ABV": "40.0%", "Band": "Wrapped in Handwoven Royal Petate Palm Band", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Armand de Brignac Ace of Spades Gold Brut Champagne",
     "Prestige golden metallic coated bottle blending vintages of Chardonnay, Pinot Noir, and Pinot Meunier with French oak dosage.",
     42000, 49000, "Armand de Brignac", "imported-spirits", "1558001375-7f3c4c92b028_aceofspades",
     ["liquor", "imported", "champagne", "armand-de-brignac", "ace-of-spades", "gold-brut"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Chigny-les-Roses, France", "ABV": "12.5%", "Decanter": "Hand-Polished Opaque Gold Metal Armor", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Monkey 47 Schwarzwald Dry Gin Handcrafted Germany (500ml)",
     "Distilled in the Black Forest with 47 unique regional botanicals including lingonberries, spruce shoots, and angelica root.",
     6800, 8200, "Black Forest Distillers", "imported-spirits", "1569529465840-7e4466b872be_monkey47",
     ["liquor", "imported", "gin", "monkey-47", "black-forest", "craft-gin", "germany"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Schwarzwald, Germany", "ABV": "47.0%", "Botanicals": "47 Native Forest Plant Species", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Louis Roederer Cristal Millesime Champagne Brut 2014",
     "Originally created in 1876 for Tsar Alexander II of Russia, presented in a flat-bottom crystal bottle with UV yellow cellophane.",
     48000, 56000, "Louis Roederer", "imported-spirits", "1558001375-7f3c4c92b028_cristal2014",
     ["liquor", "imported", "champagne", "cristal", "louis-roederer", "tsar-alexander", "prestige-cuvee"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Reims, Champagne, France", "ABV": "12.0%", "Estate": "100% Biodynamically Farmed Grand Cru Parcels", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Beluga Gold Line Russian Siberian Vodka with Hammer & Brush",
     "Crafted from malt spirit and pure Siberian artesian well water, rested for 90 days and sealed with Italian natural wax.",
     14500, 17500, "Beluga Vodka", "imported-spirits", "1569529465840-7e4466b872be_belugagold",
     ["liquor", "imported", "vodka", "beluga-gold-line", "siberian-vodka", "luxury-spirits"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Montenegro / Siberia Artesian Springs", "ABV": "40.0%", "Closure": "Sealed in Heavy Red Wax with Leather Mallet", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Chateau Margaux Premier Grand Cru Classe Bordeaux 2015",
     "Legendary Left Bank First Growth from Margaux combining pure blackcurrant, violet petals, cedarwood, and velvety tannins.",
     145000, 168000, "Château Margaux", "imported-spirits", "1558001375-7f3c4c92b028_chateaumargaux",
     ["liquor", "imported", "bordeaux-wine", "chateau-margaux", "first-growth", "premier-grand-cru"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Margaux, Bordeaux, France", "ABV": "13.5%", "Classification": "1855 Bordeaux Official First Growth (Premier Cru)", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Diplomatico Reserva Exclusiva Venezuelan Dark Rum (700ml)",
     "Copper pot still rum aged up to 12 years in oak barrels, boasting notes of dark chocolate fudge, orange peel, and brown sugar.",
     7499, 9200, "Destilerias Unidas Diplomatico", "imported-spirits", "1569529465840-7e4466b872be_diplomaticorum",
     ["liquor", "imported", "rum", "diplomatico", "venezuela", "dark-rum", "reserva-exclusiva"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "La Miel, Venezuela", "ABV": "40.0%", "Still": "Traditional Ancient Copper Pot Distillations", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Sassicaia Tenuta San Guido Bolgheri Super Tuscan Red Wine",
     "The foundational Super Tuscan wine composed of 85% Cabernet Sauvignon and 15% Cabernet Franc aged 24 months in French barriques.",
     42000, 49000, "Tenuta San Guido", "imported-spirits", "1558001375-7f3c4c92b028_sassicaia",
     ["liquor", "imported", "super-tuscan", "sassicaia", "italian-wine", "bolgheri", "cabernet"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Bolgheri, Tuscany, Italy", "ABV": "14.0%", "DOC": "Bolgheri Sassicaia Exclusive Monopole DOC", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Hendrick's Grand Cabaret Limited Edition Scottish Gin",
     "Infused with stone fruits, rose petals, sweet cucumber, and aromatic herbs inspired by 1920s Parisian cabaret revelry.",
     5899, 7200, "Hendrick's Gin", "imported-spirits", "1569529465840-7e4466b872be_hendrickscabaret",
     ["liquor", "imported", "gin", "hendricks", "grand-cabaret", "scottish-gin", "cucumber-rose"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Girvan, Ayrshire, Scotland", "ABV": "43.4%", "Stills": "Distilled in Bennett Pot & Carter-Head Stills", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Patron El Alto Extra Anejo Handcrafted Tequila (750ml)",
     "Masterfully aged for over 4 years in a combination of 11 distinct oak barrels, yielding notes of dried fruit, caramel, and vanilla.",
     28500, 33500, "Patron Spirits Mexico", "imported-spirits", "1569529465840-7e4466b872be_patronelalto",
     ["liquor", "imported", "tequila", "patron", "el-alto", "extra-anejo", "luxury-agave"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Atotonilco, Jalisco, Mexico", "ABV": "40.0%", "Barrels": "11 Different Historic Oak Casks Combination", "HSN": "2208", "Statutory_Age": "18+"}),

    # --- Imported Fine Cigars & Pipe Tobacco (22 Items) ---
    ("Cohiba Behike BHK 52 Cuban Habano Cigar (Box of 10 Cigars)",
     "The crown jewel of Habanos rolled with the rare Medio Tiempo sun-grown top leaves from Pinar del Rio in El Laguito factory.",
     185000, 215000, "Cohiba Habanos Cuba", "imported-cigars", "1527281400680-8598f3583b3a_behike52",
     ["tobacco", "imported", "cigars", "cohiba", "behike-52", "habanos", "cuba", "luxury-cigars"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "El Laguito Factory, Havana, Cuba", "Ring Gauge": "52 (20.64mm) x 119mm Length", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Montecristo No. 2 Piramides Cuban Torpedo Cigar (Box of 25)",
     "The world's most iconic pointed pyramid cigar with rich cocoa, roasted coffee bean, cinnamon, and creamy cedar smoke.",
     58000, 68000, "Montecristo Habanos", "imported-cigars", "1527281400680-8598f3583b3a_montecristo2",
     ["tobacco", "imported", "cigars", "montecristo", "piramides", "torpedo", "cuban-cigar"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Vuelta Abajo, Cuba", "Vitola": "Piramides (52 Ring Gauge x 156mm)", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Partagas Serie D No. 4 Robusto Cuban Cigar (Box of 25)",
     "Full-flavored powerhouse Cuban robusto packed with earth, leather, white pepper, and roasted hazelnut complexity.",
     42000, 49000, "Partagas Habanos", "imported-cigars", "1527281400680-8598f3583b3a_partagasd4",
     ["tobacco", "imported", "cigars", "partagas", "serie-d-no4", "robusto", "habanos"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Havana, Cuba", "Strength": "Full Bodied Authentic Cuban Tobacco", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Romeo y Julieta Churchill Grand Robusto Cuban Cigar (Box of 25)",
     "Sir Winston Churchill's favorite vitola encased in individual aluminum cedar-lined tubes with fragrant vanilla and floral notes.",
     64000, 75000, "Romeo y Julieta Habanos", "imported-cigars", "1527281400680-8598f3583b3a_churchillcigar",
     ["tobacco", "imported", "cigars", "romeo-y-julieta", "churchill", "cuban-cigar", "tubos"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Vuelta Abajo, Cuba", "Format": "Julieta No. 2 (47 Ring Gauge x 178mm)", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Davidoff Winston Churchill The Late Hour Toro Dominican Cigar (Box of 20)",
     "Blended with tobacco leaves aged for 6 months in the finest Scotch single malt whisky casks, dark oily Ecuadorian Habano wrapper.",
     48000, 56000, "Davidoff Geneva", "imported-cigars", "1527281400680-8598f3583b3a_davidofflatehour",
     ["tobacco", "imported", "cigars", "davidoff", "winston-churchill", "the-late-hour", "dominican"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Dominican Republic / Geneva", "Aging": "Tobacco Cured 6 Months in Single Malt Casks", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Arturo Fuente OpusX Forbidden X Toro Handcrafted Cigar (Box of 10)",
     "Legendary Dominican Chateau de la Fuente shade-grown rosado wrapper providing intense sweet spice and leather complexity.",
     54000, 62000, "Arturo Fuente", "imported-cigars", "1527281400680-8598f3583b3a_opusx",
     ["tobacco", "imported", "cigars", "arturo-fuente", "opusx", "dominican-cigar", "chateau-fuente"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Santiago, Dominican Republic", "Wrapper": "100% Dominican Sun-Grown Rosado Leaf", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Hoyo de Monterrey Epicure No. 2 Robusto Cuban Cigar (Box of 25)",
     "Light to medium-bodied benchmark Cuban cigar characterized by creamy cocoa, toasted brioche, and delicate sweet spices.",
     38000, 45000, "Hoyo de Monterrey", "imported-cigars", "1527281400680-8598f3583b3a_epicure2",
     ["tobacco", "imported", "cigars", "hoyo-de-monterrey", "epicure-no-2", "cuban-cigar", "robusto"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "San Juan y Martinez, Cuba", "Body": "Smooth Creamy Light-Medium Strength", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Padron 1926 Serie No. 9 Natural Nicaraguan Box-Pressed Cigar (Box of 24)",
     "Created for Jose O. Padron's 75th birthday using 5-year aged Nicaraguan tobaccos with chocolate, espresso, and walnut nuances.",
     52000, 60000, "Padron Cigars", "imported-cigars", "1527281400680-8598f3583b3a_padron1926",
     ["tobacco", "imported", "cigars", "padron", "1926-serie", "nicaragua", "box-pressed"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Esteli, Nicaragua", "Press": "Square Box-Pressed Aged Tobacco", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Trinidad Vigia Short Robusto Cuban Cigar (Box of 12)",
     "Signature pigtail cap with honey, cedar, and warm nutmeg spice rolled with the finest leaves from Vuelta Abajo.",
     34000, 41000, "Trinidad Habanos", "imported-cigars", "1527281400680-8598f3583b3a_trinidadvigia",
     ["tobacco", "imported", "cigars", "trinidad", "vigia", "cuban-cigar", "pigtail-cap"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Havana, Cuba", "Gauge": "54 Heavy Ring Gauge x 110mm Length", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Dunhill Early Morning Pipe Tobacco Mixture 50g Tin",
     "Traditional English blend combining golden and red Virginias with aromatic Oriental tobaccos and subtle smoky Latakia.",
     3499, 4300, "Dunhill Tobacco", "imported-cigars", "1527281400680-8598f3583b3a_dunhillearlymorning",
     ["tobacco", "imported", "pipe-tobacco", "dunhill", "early-morning", "latakia", "virginia-blend"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "United Kingdom / Denmark", "Blend": "Bright Virginias, Turkish & Smoky Latakia", "HSN": "2403", "Statutory_Age": "18+"}),

    ("Peterson of Dublin Deluxe Briar Tobacco Pipe Handcrafted Ireland",
     "Aged Mediterranean briarwood pipe with Peterson dry system reservoir, sterling silver hallmarked band, and vulcanite stem.",
     18900, 22500, "Peterson of Dublin", "imported-cigars", "1527281400680-8598f3583b3a_petersonpipe",
     ["tobacco", "imported", "briar-pipe", "peterson", "ireland", "sterling-silver", "pipe-smoking"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Dublin, Ireland", "Briar": "Century-Old Cured Mediterranean Briar", "HSN": "9614", "GST_Rate": "18%"}),

    ("S.T. Dupont Ligne 2 Cling Sound Gold Diamond Head Cigar Lighter",
     "French master metallurgy producing the world-famous crystalline 'cling' chime upon opening, dual yellow cigar torch flame.",
     89000, 99000, "S.T. Dupont Paris", "imported-cigars", "1527281400680-8598f3583b3a_stdupontlighter",
     ["tobacco", "imported", "st-dupont", "lighter", "ligne-2", "gold-plated", "luxury-lighter"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Faverges, France", "Finish": "24K Yellow Gold Diamond Head Guilloche", "Sound": "Famous Perfect Cling Resonance Tone", "HSN": "9613", "GST_Rate": "18%"}),

    ("Elie Bleu Macassar Ebony Spanish Cedar Humidor (110 Cigars)",
     "Handcrafted in Paris using rare Macassar ebony exterior veneer, aromatic Spanish cedar lining, and needle hygrometer.",
     165000, 195000, "Elie Bleu Paris", "imported-cigars", "1527281400680-8598f3583b3a_eliebleuhumidor",
     ["tobacco", "imported", "humidor", "elie-bleu", "cigar-storage", "macassar-ebony", "luxury"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Paris, France", "Wood": "Precious Macassar Ebony & Spanish Cedar", "Capacity": "Holds 110 Churchill/Robusto Format Cigars", "HSN": "4420", "GST_Rate": "18%"}),

    ("Ashton VSG (Virgin Sun Grown) Sorcerer Dominican Cigar (Box of 24)",
     "Ecuadorian sun-grown wrapper aged in proprietary cloud mist with 5-year aged Dominican filler for powerhouse leather spice.",
     44000, 51000, "Ashton Cigars", "imported-cigars", "1527281400680-8598f3583b3a_ashtonvsg",
     ["tobacco", "imported", "cigars", "ashton", "vsg", "sun-grown", "dominican-cigar"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Santiago, Dominican Republic", "Wrapper": "Private Reserve Oliva Ecuadorian Sun-Grown", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Oliva Serie V Melanio Figurado Box-Pressed Cigar (Box of 10)",
     "Cigar of the Year winner featuring an exquisite Ecuadorian Sumatra wrapper over Jalapa Valley aged Nicaraguan ligero tobaccos.",
     24999, 29000, "Oliva Cigar Co.", "imported-cigars", "1527281400680-8598f3583b3a_olivamelanio",
     ["tobacco", "imported", "cigars", "oliva", "melanio", "figurado", "cigar-of-the-year"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Esteli, Nicaragua", "Awards": "Cigar Aficionado #1 Cigar of the Year", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Mac Baren 7 Seas Regular Pipe Tobacco Blend 50g Pouch",
     "Aromatic pipe tobacco blend of mellow golden Virginias and silky black Cavendish with creamy chocolate and vanilla notes.",
     1999, 2600, "Mac Baren Denmark", "imported-cigars", "1527281400680-8598f3583b3a_macbaren7seas",
     ["tobacco", "imported", "pipe-tobacco", "mac-baren", "cavendish", "denmark"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Svendborg, Denmark", "Cut": "Ribbon Cut Easy-Packing Cavendish", "HSN": "2403", "Statutory_Age": "18+"}),

    ("Colibri Quasar 2-in-1 Desktop Cigar V-Cutter & S-Cutter",
     "Cast metal pyramid design housing spring-loaded razor surgical stainless steel blades for precise deep V-cut and straight guillotine.",
     14990, 17500, "Colibri London", "imported-cigars", "1527281400680-8598f3583b3a_colibricutter",
     ["tobacco", "imported", "cigar-cutter", "colibri", "v-cut", "guillotine", "cigar-accessories"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "London, UK", "Blades": "440C Stainless Steel Razor Sharp Dual Blades", "HSN": "8205", "GST_Rate": "18%"}),

    ("Captain Black Regular Royal Pipe Tobacco (42.5g Pouch)",
     "The iconic American sweet aromatic blend of steamed black and golden cavendish with hints of vanilla cream and toasted marshmallow.",
     1650, 2200, "Captain Black USA", "imported-cigars", "1527281400680-8598f3583b3a_captainblack",
     ["tobacco", "imported", "pipe-tobacco", "captain-black", "aromatic", "vanilla-cream"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Richmond, Virginia, USA", "Room Note": "Extremely Pleasant Vanilla & Caramel Scent", "HSN": "2403", "Statutory_Age": "18+"}),

    ("Xikar HP4 High Performance Quadruple Jet Torch Cigar Lighter",
     "Four angled high-output windproof jet flames engineered for rapid lighting of large 60-ring gauge premium cigars.",
     12500, 15000, "Xikar USA", "imported-cigars", "1527281400680-8598f3583b3a_xikarhp4",
     ["tobacco", "imported", "torch-lighter", "xikar", "quad-flame", "windproof", "cigar-gear"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Kansas City, USA", "Flames": "4 Angled Inverted Torch Jets Engineered for Wind", "HSN": "9613", "GST_Rate": "18%"}),

    ("Boveda 72% RH 2-Way Humidity Control Packs (Box of 12)",
     "Patented reverse-osmosis salt-water membrane maintaining a precise 72% relative humidity level inside wooden desktop humidors.",
     3200, 4000, "Boveda USA", "imported-cigars", "1527281400680-8598f3583b3a_bovedapacks",
     ["tobacco", "imported", "boveda", "humidity-control", "humidor-care", "cigar-freshness"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Minnetonka, Minnesota, USA", "RH": "72% Relative Humidity Precision Buffer", "HSN": "3824", "GST_Rate": "18%"}),

    ("Al Fakher Dubai Shisha Hookah Molasses Double Apple 1 kg Tub",
     "The worldwide champion hookah tobacco soaked in pure vegetable molasses and natural green and red apple essences.",
     3899, 4999, "Al Fakher Dubai", "imported-cigars", "1527281400680-8598f3583b3a_alfakherdoubleapple",
     ["tobacco", "imported", "hookah", "shisha", "al-fakher", "double-apple", "dubai-tobacco"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Ajman, United Arab Emirates", "Flavor": "Classic Anise-Infused Double Red & Green Apple", "HSN": "2403", "Statutory_Age": "18+"}),

    ("Bongani Robusto Hand-Rolled African Cigar (Box of 10)",
     "Africa's first luxury handmade cigar crafted in Mozambique using aged Cameroon wrapper and rich African soil tobacco.",
     18900, 22500, "Bongani Cigars", "imported-cigars", "1527281400680-8598f3583b3a_bonganicigar",
     ["tobacco", "imported", "cigars", "bongani", "african-cigar", "cameroon-wrapper"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Imported", "Origin": "Maputo, Mozambique", "Wrapper": "Oily Rich Cameroon Sun-Cured Leaf", "HSN": "2402", "Statutory_Age": "18+"})
]

# ==========================================
# 55 DOMESTIC LUXURY SPIRITS, GINS & TOBACCO
# ==========================================
DOMESTIC_ITEMS = [
    # --- Indian Single Malts & Craft Whiskies (18 Items) ---
    ("Amrut Fusion Indian Single Malt Whisky (750ml)",
     "Crafted from 75% unpeated Indian malted barley and 25% peated Scottish barley, distilled in Bangalore at 3,000 feet elevation.",
     5800, 6800, "Amrut Distilleries", "domestic-whisky", "1527281400680-8598f3583b3a_amrutfusion",
     ["liquor", "domestic", "indian-single-malt", "amrut", "amrut-fusion", "bangalore-whisky"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Kambipura, Bengaluru, Karnataka", "ABV": "50.0%", "Accolade": "Jim Murray World Whisky of the Year Award", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Paul John Mithuna Zodiac Series Indian Single Malt",
     "Matured in virgin American oak barrels and finished in ex-bourbon casks in tropical Goa, yielding honeycomb, mocha, and oak spice.",
     21500, 25000, "Paul John Distilleries", "domestic-whisky", "1514432324607-a09d9b4aefdd_pauljohnmithuna",
     ["liquor", "domestic", "paul-john", "mithuna", "single-malt", "goa", "zodiac-series"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Cuncolim, Goa, India", "ABV": "58.0% Cask Strength", "Aging": "Tropical Maturation Accelerated by Coastal Humidity", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Indri-Trini Three Wood Indian Single Malt Whisky",
     "Distilled from indigenous 6-row Indian barley in Haryana and matured in three distinct wood casks: Ex-Bourbon, Ex-Wine, and PX Sherry.",
     4999, 5999, "Piccadily Agro Industries", "domestic-whisky", "1527281400680-8598f3583b3a_indritrini",
     ["liquor", "domestic", "indri", "three-wood", "indian-whisky", "single-malt", "haryana"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Indri, Karnal, Haryana", "ABV": "46.0%", "Barrels": "Triple Cask Matured (Bourbon, French Wine, Pedro Ximenez)", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Rampur Double Cask Non-Chill Filtered Single Malt",
     "Handcrafted at the foothills of the Himalayas in copper pot stills, aged in American Bourbon barrels and European Sherry butts.",
     8999, 10500, "Radico Khaitan Rampur", "domestic-whisky", "1514432324607-a09d9b4aefdd_rampurdoublecask",
     ["liquor", "domestic", "rampur", "single-malt", "himalayan-foothills", "double-cask"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Rampur, Uttar Pradesh", "ABV": "45.0%", "Distillation": "Traditional Indian Copper Pot Stills Established 1943", "HSN": "2208", "Statutory_Age": "18+"}),

    ("GianChand Single Malt Whisky by DeVANS Modern Distillers",
     "Matured in Jammu & Kashmir pine forests, praised by Jim Murray as having delicate sweet pineapple, vanilla, and gentle peat.",
     4500, 5400, "DeVANS Modern Breweries", "domestic-whisky", "1527281400680-8598f3583b3a_gianchand",
     ["liquor", "domestic", "gianchand", "jammu", "single-malt", "devans", "jim-murray"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Bohri, Jammu, Jammu & Kashmir", "ABV": "42.8%", "Grain": "Specially Selected North Indian 6-Row Malted Barley", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Godawan Artisanal Single Malt Whisky Century Reserve (Rajasthan)",
     "Distilled in the Thar desert from slow-ripened 6-row barley and matured in casks infused with rare Rajasthani botanical woods.",
     5800, 6900, "Diageo India Godawan", "domestic-whisky", "1514432324607-a09d9b4aefdd_godawanmalt",
     ["liquor", "domestic", "godawan", "rajasthan", "desert-whisky", "single-malt", "botanical-cask"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Alwar, Rajasthan", "ABV": "46.0%", "Finishing": "Finished with Indian Botanicals Rasna & Jatamansi", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Amrut Greedy Angels 10 Year Old Chairman's Reserve",
     "Rare 10-year-old Indian malt that survived the severe 12% annual tropical angel's share evaporation in Bangalore.",
     78000, 89000, "Amrut Distilleries", "domestic-whisky", "1527281400680-8598f3583b3a_greedyangels",
     ["liquor", "domestic", "amrut", "greedy-angels", "10-years", "rare-whisky", "luxury-indian"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Bengaluru, Karnataka", "ABV": "55.0% Cask Strength", "Decanter": "Crystal Decanter with Engraved Heavy Stopper", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Paul John Oloroso Select Cask Indian Single Malt",
     "Finished in rich Oloroso sherry casks under Goan coastal breezes, exhibiting orange peel, Christmas fruitcake, and dark chocolate.",
     9800, 11800, "Paul John Distilleries", "domestic-whisky", "1514432324607-a09d9b4aefdd_pauljohnoloroso",
     ["liquor", "domestic", "paul-john", "oloroso-cask", "goa-whisky", "single-malt", "coastal"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Goa, India", "ABV": "48.0%", "Cask": "100% Spanish Oloroso Sherry Wood Casks", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Kamet Single Malt Whisky Peak of the Himalayas",
     "Crafted with 6-row barley grown in the foothills of the Himalayas and aged in a combination of American oak, French wine, and sherry casks.",
     3800, 4600, "Peak Spirits", "domestic-whisky", "1527281400680-8598f3583b3a_kametmalt",
     ["liquor", "domestic", "kamet", "himalayan-whisky", "single-malt", "six-row-barley"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Kurukshetra, Haryana", "ABV": "42.8%", "Flavor": "Fruity, Spiced Oak, Vanilla Creme Brûlée", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Amrut Naarangi Orange Peel Sherry Matured Single Malt",
     "Unique single malt matured in Oloroso sherry casks previously conditioned with fresh Spanish orange peels for three years.",
     14500, 17500, "Amrut Distilleries", "domestic-whisky", "1514432324607-a09d9b4aefdd_amrutnaarangi",
     ["liquor", "domestic", "amrut", "naarangi", "orange-sherry", "single-malt", "innovative"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Bengaluru, Karnataka", "ABV": "46.0%", "Specialty": "Sherry Cask Conditioned with Fresh Orange Peels", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Woodburns Contemporary Indian Blended Malt Whisky",
     "Charred virgin oak cask matured blended malt produced in Goa with bold smoky character and notes of roasted sesame and honey.",
     2800, 3400, "Fullarton Distilleries", "domestic-whisky", "1527281400680-8598f3583b3a_woodburnswhisky",
     ["liquor", "domestic", "woodburns", "blended-malt", "goa-distillery", "charred-oak"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Candepar, Goa", "ABV": "42.8%", "Barrels": "Double-Charred Virgin American White Oak", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Rampur Asava Indian Single Malt Finished in Indian Cabernet Casks",
     "Matured in American Bourbon barrels and finished in Indian red wine casks, balancing tropical dried fruits with velvety tannins.",
     11200, 13500, "Radico Khaitan Rampur", "domestic-whisky", "1514432324607-a09d9b4aefdd_rampurasava",
     ["liquor", "domestic", "rampur", "asava", "cabernet-cask", "wine-finish", "single-malt"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Rampur, Uttar Pradesh", "ABV": "45.0%", "Finish": "Ex-Indian Cabernet Sauvignon Wine Barrels", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Longitude77 Indian Single Malt by Pernod Ricard India",
     "Distilled in Dindori, Nashik celebrating the 77th meridian east that passes through India, aged in ex-bourbon and wine casks.",
     5900, 7100, "Pernod Ricard India", "domestic-whisky", "1527281400680-8598f3583b3a_longitude77",
     ["liquor", "domestic", "longitude77", "pernod-ricard", "dindori", "nashik", "single-malt"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Dindori, Nashik, Maharashtra", "ABV": "42.8%", "Grain": "100% Indian Malted 6-Row Barley", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Paul John Nirvana Unpeated Indian Single Malt (Goa)",
     "Gentle coastal unpeated malt bursting with honeyed fruitcake, sweet bourbon vanilla, and light seaside salt breeze.",
     3200, 3900, "Paul John Distilleries", "domestic-whisky", "1514432324607-a09d9b4aefdd_pauljohnnirvana",
     ["liquor", "domestic", "paul-john", "nirvana", "unpeated", "goa-whisky", "entry-single-malt"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Cuncolim, Goa", "ABV": "40.0%", "Finish": "Matured in Handpicked American Oak Casks", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Amrut Peated Indian Single Malt Cask Strength (62.8% ABV)",
     "Distilled from Scottish peated barley and matured rapidly in the tropical heat of Bangalore, delivering dense smoky barbecue ash.",
     8500, 10200, "Amrut Distilleries", "domestic-whisky", "1527281400680-8598f3583b3a_amrutpeated",
     ["liquor", "domestic", "amrut", "peated", "cask-strength", "bangalore", "heavy-smoke"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Bengaluru, Karnataka", "ABV": "62.8% Natural Cask Strength", "Peat": "Phenol Level 45+ PPM Scottish Peat", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Oaksmith Gold International Blended Whisky by Shinji Fukuyo",
     "Crafted by Suntory's Chief Blender Shinji Fukuyo blending aged Scotch malts and smooth Kentucky bourbons with Indian grain spirits.",
     1890, 2350, "Beam Suntory India", "domestic-whisky", "1514432324607-a09d9b4aefdd_oaksmithgold",
     ["liquor", "domestic", "oaksmith", "beam-suntory", "shinji-fukuyo", "blended-whisky"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "India / Beam Suntory Crafted", "ABV": "42.8%", "Blender": "Crafted by Suntory Master Blender Shinji Fukuyo", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Royal Ranthambore Heritage Collection Flavourful Whisky",
     "Inspired by the royal tigers of Ranthambore, crafted with imported Scottish scotch malts blended with fine Indian grain spirits.",
     2150, 2600, "Radico Khaitan", "domestic-whisky", "1527281400680-8598f3583b3a_royalranthambore",
     ["liquor", "domestic", "ranthambore", "heritage-whisky", "radico-khaitan", "tiger-reserve"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Rampur, Uttar Pradesh", "ABV": "42.8%", "Bottle": "Royal Decanter with Tiger Stamped Crest", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Indri Dru Cask Strength Bourbon Wood Indian Single Malt",
     "Pure bourbon cask matured single malt bottled at 57.2% natural barrel proof, exploding with toasted vanilla, dry fruit, and oak.",
     8200, 9900, "Piccadily Agro Industries", "domestic-whisky", "1514432324607-a09d9b4aefdd_indridru",
     ["liquor", "domestic", "indri", "dru", "cask-strength", "bourbon-wood", "single-malt"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Indri, Karnal, Haryana", "ABV": "57.2% Full Barrel Proof", "Awards": "San Francisco World Spirits Double Gold", "HSN": "2208", "Statutory_Age": "18+"}),

    # --- Indian Craft Gins, Agave, Wines & Craft Beers (22 Items) ---
    ("Stranger & Sons Indian Spirited Craft Gin (Goa 700ml)",
     "Distilled in Ponda, Goa using black pepper, nutmeg, mace, coriander, angelica, and citrus peel from four distinct Indian citrus varietals.",
     2450, 2999, "Third Eye Distillery", "domestic-spirits", "1569529465840-7e4466b872be_strangersons",
     ["liquor", "domestic", "gin", "stranger-and-sons", "goa", "craft-gin", "indian-citrus"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Ponda, Goa, India", "ABV": "42.8%", "Botanicals": "Gondhoraj Lime, Nagpur Orange & Indian Spices", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Hapusa Himalayan Dry Craft Gin with Foraged Wild Juniper (700ml)",
     "Distilled with wild juniper berries foraged from the snow-covered slopes of the Himalayas, turmeric, mango, and gondhoraj lime.",
     3200, 3850, "Nao Spirits", "domestic-spirits", "1569529465840-7e4466b872be_hapusagin",
     ["liquor", "domestic", "gin", "hapusa", "himalayan-juniper", "nao-spirits", "craft-gin"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Goa, India (Himalayan Botanical Harvest)", "ABV": "43.0%", "Juniper": "100% Wild Himalayan Juniper (Hapusa)", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Greater Than London Dry Indian Craft Gin (750ml)",
     "India's first craft gin distilled in copper pot stills with botanicals like juniper, coriander seeds, fennel, chamomile, and ginger.",
     1450, 1800, "Nao Spirits", "domestic-spirits", "1569529465840-7e4466b872be_greaterthan",
     ["liquor", "domestic", "gin", "greater-than", "nao-spirits", "london-dry", "goa"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Goa, India", "ABV": "40.0%", "Copper Still": "Distilled in Custom-Built Copper Pot 'Prudence'", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Terai India Dry Handcrafted Small Batch Gin (750ml)",
     "Grain-to-glass craft gin distilled in Behror, Rajasthan in hand-beaten German copper stills with botanicals from Khari Baoli.",
     2150, 2600, "Globus Spirits", "domestic-spirits", "1569529465840-7e4466b872be_teraigin",
     ["liquor", "domestic", "gin", "terai", "grain-to-glass", "craft-gin", "rajasthan"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Behror, Rajasthan", "ABV": "42.8%", "Bottle": "Fluted Pillar Architecture with Wooden Stopper", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Pistola Phoenix 100% Pure Agave Reposado Indian Spirit",
     "Crafted from 100% wild blue agave grown in the red volcanic soils of the Deccan Plateau, matured in virgin American oak barrels.",
     3800, 4500, "Pass Code Spirits Goa", "domestic-spirits", "1569529465840-7e4466b872be_pistolaagave",
     ["liquor", "domestic", "agave", "pistola", "reposado", "indian-tequila", "goa"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Goa, India (Deccan Highland Wild Agave)", "ABV": "40.0%", "Agave": "100% Agave Americana (No Additives)", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Old Monk The Legend 12 Year Old Indian Vatted Dark Rum",
     "Iconic blend matured in oak vats for 12 years and presented in the collector's glass bottle sculpted in the shape of the monk's head.",
     1850, 2300, "Mohan Meakin Brewery", "domestic-spirits", "1569529465840-7e4466b872be_oldmonklegend",
     ["liquor", "domestic", "rum", "old-monk", "the-legend", "12-years", "dark-rum", "mohan-meakin"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Kasauli / Ghaziabad, Mohan Meakin", "ABV": "42.8%", "Bottle": "Sculpted Glass Bust of the Ancient Monk", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Maka Zai Gold Aged Indian Artisanal Rum (Goa 750ml)",
     "Matured in medium-charred American oak ex-bourbon casks, boasting wild honey, praline, candied fig, and warm cinnamon spices.",
     2450, 2999, "Stilldistilling Spirits Goa", "domestic-spirits", "1569529465840-7e4466b872be_makazai",
     ["liquor", "domestic", "rum", "maka-zai", "gold-rum", "goa-spirits", "artisanal-rum"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Ponda, Goa", "ABV": "42.8%", "Casks": "Charred American Oak Ex-Bourbon Barrels", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Sula Rasa Cabernet Sauvignon Estate Reserve Red Wine (750ml)",
     "The flagship reserve red wine from Dindori estate, aged for 14 to 16 months in French oak barrels with dark fruit and mocha.",
     2150, 2600, "Sula Vineyards Nashik", "domestic-spirits", "1558001375-7f3c4c92b028_sularasa",
     ["liquor", "domestic", "wine", "sula", "rasa", "cabernet-sauvignon", "nashik", "reserve-wine"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Dindori Estate, Nashik, Maharashtra", "ABV": "14.0%", "Aging": "16 Months in French Oak Barriques", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Fratelli SETTE Super Tuscan Style Indian Red Wine (750ml)",
     "Masterfully blended by Italian winemaker Piero Masi from 70% Sangiovese and 30% Cabernet Sauvignon, aged 24 months in French oak.",
     2450, 2999, "Fratelli Vineyards Akluj", "domestic-spirits", "1558001375-7f3c4c92b028_fratellisette",
     ["liquor", "domestic", "wine", "fratelli", "sette", "sangiovese", "akluj", "iconic-wine"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Akluj, Solapur, Maharashtra", "ABV": "13.5%", "Winemaker": "Master Enologist Piero Masi (Tuscany)", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Grover Zampa Chêne Grande Reserve Tempranillo Shiraz",
     "Matured for 15 months in French oak barrels, delivering rich dark berry compote, roasted coffee, tobacco, and velvety tannins.",
     2250, 2750, "Grover Zampa Vineyards", "domestic-spirits", "1558001375-7f3c4c92b028_groverchene",
     ["liquor", "domestic", "wine", "grover-zampa", "chene", "tempranillo", "shiraz", "nandi-hills"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Nandi Hills, Karnataka", "ABV": "14.0%", "Oak": "15 Months in New French Tronçais Oak Casks", "HSN": "2204", "Statutory_Age": "18+"}),

    ("York Arros Reserve Red Wine Nashik (Shiraz Cabernet Sauvignon)",
     "Produced from select parcels on the slopes overlooking the Gangapur Dam in Nashik, aged 13 months in American and French oak.",
     1899, 2350, "York Winery Nashik", "domestic-spirits", "1558001375-7f3c4c92b028_yorkarros",
     ["liquor", "domestic", "wine", "york-winery", "arros", "shiraz-cabernet", "nashik"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Gangapur Dam, Nashik, Maharashtra", "ABV": "14.0%", "Barrels": "Aged in French and American Oak Barrels", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Samsara The City of Pink Small Batch Handcrafted Gin (750ml)",
     "Distilled in Goa with 11 botanicals including fresh rose petals, vetiver, cardamom, and juniper, paying homage to Jaipur.",
     2350, 2800, "Spaceman Spirits Lab", "domestic-spirits", "1569529465840-7e4466b872be_samsaragin",
     ["liquor", "domestic", "gin", "samsara", "pink-city", "rose-gin", "craft-gin"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Goa, India", "ABV": "43.0%", "Botanicals": "Organic Rose Petals, Juniper & Green Cardamom", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Bira 91 White Belgian Style Wheat Craft Beer (Pack of 6 Cans 500ml)",
     "Low bitterness craft wheat beer brewed with malted wheat, barley, sweet orange peels, and crushed Indian coriander seeds.",
     990, 1250, "B9 Beverages Bira 91", "domestic-spirits", "1558001375-7f3c4c92b028_bira91white",
     ["liquor", "domestic", "beer", "craft-beer", "bira-91", "wheat-beer", "belgian-style"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Mysuru, Karnataka", "ABV": "4.7%", "Style": "Belgian Style Spiced Wheat Ale", "HSN": "2203", "Statutory_Age": "18+"}),

    ("Simba Stout Craft Beer with Roasted Caramel Malts (Pack of 6 Bottles)",
     "India's premier craft stout brewed with deep roasted chocolate malts, oats, and dark espresso aromas.",
     1150, 1450, "Simba Craft Brewery", "domestic-spirits", "1558001375-7f3c4c92b028_simbastout",
     ["liquor", "domestic", "beer", "stout", "simba", "craft-beer", "roasted-malt"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Durg, Chhattisgarh", "ABV": "5.0%", "Color": "Pitch Black with Rich Creamy Tan Head", "HSN": "2203", "Statutory_Age": "18+"}),

    ("Krsma Cabernet Sauvignon Reserve Hampi Hills (750ml)",
     "Boutique single vineyard red wine grown in the rocky mineral-rich soils of Hampi Hills, aged 12 months in French oak.",
     2650, 3200, "Krsma Estates Hampi", "domestic-spirits", "1558001375-7f3c4c92b028_krsmacabernet",
     ["liquor", "domestic", "wine", "krsma", "hampi-hills", "cabernet-sauvignon", "boutique-wine"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Hampi Hills, Karnataka", "ABV": "14.5%", "Terroir": "Arid Mineral Soil of Ancient Hampi Ruins", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Goa Cashew Feni GI-Tagged Traditional Heritage Spirit (750ml)",
     "Triple distilled from naturally fermented fresh cashew apple juice in traditional copper alembic stills (bhatti).",
     1250, 1600, "Cazulo Premium Feni Goa", "domestic-spirits", "1569529465840-7e4466b872be_cashewfeni",
     ["liquor", "domestic", "feni", "cashew-feni", "goa", "gi-tag", "heritage-spirit"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Cansaulim, Goa (GI Tagged)", "ABV": "42.8%", "Distillation": "Traditional Firewood Bhatti Distillation", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Toit Tin Man Copper Ale Handcrafted Craft Beer (Pack of 6 Cans)",
     "Rich English style copper amber ale brewed in Bangalore with toffee malt backbone and aromatic floral hops.",
     1190, 1490, "Toit Brewpub Bangalore", "domestic-spirits", "1558001375-7f3c4c92b028_toittinman",
     ["liquor", "domestic", "beer", "toit", "copper-ale", "bangalore-brewery", "craft-beer"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Indiranagar, Bengaluru, Karnataka", "ABV": "5.2%", "Malts": "English Pale & Crystal Toffee Malts", "HSN": "2203", "Statutory_Age": "18+"}),

    ("Jaisalmer Indian Craft Gin Small Batch Triple Distilled (750ml)",
     "Distilled in copper pot stills at Rampur with 11 botanicals including Darjeeling green tea, lemon peel, and cubeb pepper.",
     3499, 4200, "Radico Khaitan", "domestic-spirits", "1569529465840-7e4466b872be_jaisalmergin",
     ["liquor", "domestic", "gin", "jaisalmer", "craft-gin", "darjeeling-tea", "gold-crested"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Rampur, Uttar Pradesh", "ABV": "43.0%", "Botanicals": "Handpicked Darjeeling Green Tea & Cubeb Pepper", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Segura Viudas / Chandon Brut Sparkling Wine Nashik (750ml)",
     "Methode Traditionnelle sparkling wine crafted in Dindori from Chenin Blanc, Chardonnay, and Pinot Noir with fine persistent bubbles.",
     1850, 2300, "Chandon India Nashik", "domestic-spirits", "1558001375-7f3c4c92b028_chandonbrut",
     ["liquor", "domestic", "sparkling-wine", "chandon", "methode-traditionnelle", "nashik"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Dindori, Nashik, Maharashtra", "ABV": "12.5%", "Method": "Secondary Fermentation in Bottle (Champagne Method)", "HSN": "2204", "Statutory_Age": "18+"}),

    ("Goa Mahua Spirit Heritage Wild Flower Distillate (750ml)",
     "Fermented from sun-dried flowers of the sacred Madhuca longifolia tree, celebrated as India's indigenous forest spirit.",
     2150, 2600, "Mondovi Forest Spirits", "domestic-spirits", "1569529465840-7e4466b872be_mahuaspirit",
     ["liquor", "domestic", "mahua", "forest-spirit", "tribal-heritage", "madhuca-longifolia"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Bastar / Goa Distillation", "ABV": "40.0%", "Flower": "100% Wild Forest Mahua Flower Nectar", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Maka Zai White Rum Tribute to the Olive Ridley Turtle (750ml)",
     "Clear, sweet, creamy white rum distilled from locally grown sugarcane in Goa, perfect for daiquiris and tropical mojitos.",
     1890, 2350, "Stilldistilling Spirits Goa", "domestic-spirits", "1569529465840-7e4466b872be_makazaiwhite",
     ["liquor", "domestic", "rum", "white-rum", "maka-zai", "goa", "cocktails"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Ponda, Goa", "ABV": "40.0%", "Charity": "Portion of Proceeds Donated to Olive Ridley Turtles", "HSN": "2208", "Statutory_Age": "18+"}),

    ("Geist Witty Neighbor Belgian Witbier Craft Beer (Pack of 6 Cans)",
     "Unfiltered hazy craft wheat beer brewed in Bangalore with orange zest and roasted ground coriander.",
     1100, 1400, "Geist Brewing Co. Bangalore", "domestic-spirits", "1558001375-7f3c4c92b028_geistwitty",
     ["liquor", "domestic", "beer", "craft-beer", "geist", "witbier", "bangalore-beer"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Bengaluru, Karnataka", "ABV": "5.0%", "Hops": "Noble Hallertau Traditional German Hops", "HSN": "2203", "Statutory_Age": "18+"}),

    # --- Indian Heritage Tobaccos, Handcrafted Bidis & Hookah (15 Items) ---
    ("Artisanal Hand-Rolled Tendu Leaf Royal Bidis (Box of 500 Sticks)",
     "Traditional sun-cured Gujarat unadulterated tobacco flakes hand-rolled inside natural tendu (Diospyros melanoxylon) leaves.",
     999, 1350, "Jabalpur Bidi Guild", "domestic-tobacco", "1527281400680-8598f3583b3a_tendubidis",
     ["tobacco", "domestic", "bidi", "tendu-leaf", "hand-rolled", "indian-tobacco"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Jabalpur, Madhya Pradesh", "Leaf": "Wild Forest Harvested Clean Tendu Leaf", "HSN": "2402", "Statutory_Age": "18+"}),

    ("Sohna Desi Hookah Tobacco Molasses with Khandsari & Rose (500g)",
     "Sun-cured dark Nicotiana rustica leaf mixed with natural unrefined liquid jaggery, dried rose petals, and kewra water.",
     650, 850, "Haryana Desi Hookah Guild", "domestic-tobacco", "1527281400680-8598f3583b3a_desihookah",
     ["tobacco", "domestic", "hookah", "desi-hookah", "khandsari-tobacco", "haryana"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Rohtak, Haryana", "Ingredients": "Rustica Leaf, Molasses, Kewra, Damask Rose", "HSN": "2403", "Statutory_Age": "18+"}),

    ("Guntur Flue-Cured Virginia (FCV) Raw Whole Tobacco Leaves (1 kg)",
     "Bright lemon-orange whole Virginia leaf cured in barns in Andhra Pradesh, natural aroma for custom pipe blending.",
     1250, 1600, "Andhra Tobacco Board", "domestic-tobacco", "1527281400680-8598f3583b3a_gunturleaves",
     ["tobacco", "domestic", "fcv-tobacco", "raw-leaves", "andhra-pradesh", "guntur", "virginia-leaf"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Guntur & Prakasam Districts, Andhra Pradesh", "Grade": "Grade 1 Lemon Flue-Cured Virginia", "HSN": "2401", "Statutory_Age": "18+"}),

    ("Handmade Carved Brass Sheesha Hookah 24-inch with Velvet Hose",
     "Traditional heavy Moradabad cast brass hookah with water reservoir base, chillum bowl, charcoal tongs, and embroidered hose.",
     4899, 5999, "Moradabad Brass Craft", "domestic-tobacco", "1527281400680-8598f3583b3a_brasshookah",
     ["tobacco", "domestic", "hookah", "sheesha", "brass-hookah", "moradabad", "smoking-accessories"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Moradabad, Uttar Pradesh", "Height": "24-inch Heavy Solid Brass Assembly", "HSN": "9614", "GST_Rate": "18%"}),

    ("Clay Terracotta Hookah Chillum (Hand-Thrown Earthen Bowls Box of 5)",
     "Traditional baked red clay chillums hand-molded by potters in Rajasthan for authentic smokeless tobacco filtration.",
     450, 600, "Mitti Heritage Kumhars", "domestic-tobacco", "1527281400680-8598f3583b3a_claychillum",
     ["tobacco", "domestic", "chillum", "clay-bowl", "terracotta", "hookah-accessories"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Alwar, Rajasthan", "Material": "100% Unvarnished Natural Porous Clay", "HSN": "6913", "GST_Rate": "12%"}),

    ("Natural Coconut Shell Hookah Charcoal Briquettes (1 kg Box 72 Cubes)",
     "Zero-odor, sulfur-free, high-density compressed coconut shell cubes that burn evenly for up to 90 minutes without sparks.",
     499, 680, "Pollachi Coir Products", "domestic-tobacco", "1527281400680-8598f3583b3a_coconucharcoal",
     ["tobacco", "domestic", "hookah-charcoal", "coconut-coal", "sulfur-free", "clean-burn"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Pollachi, Tamil Nadu", "Burn Time": "Up to 90 Minutes Continuous Odorless Heat", "HSN": "4402", "GST_Rate": "5%"}),

    ("Handmade Sheesham Wood Cigar Ashtray with Brass Inlay",
     "Solid North Indian rosewood square ashtray equipped with four brass cigar grooved rests and removable steel ash bowl.",
     1899, 2450, "Saharanpur Wood Artisans", "domestic-tobacco", "1527281400680-8598f3583b3a_sheeshamashtray",
     ["tobacco", "domestic", "cigar-ashtray", "sheesham", "brass-inlay", "cigar-accessories"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Saharanpur, Uttar Pradesh", "Rests": "4 Precision Machined Solid Brass Cigar Grooves", "HSN": "4420", "GST_Rate": "12%"}),

    ("Afzal Indian Herbal Shisha Molasses Nicotine-Free Paan Raas (500g)",
     "Tobacco-free and nicotine-free herbal hookah molasses reproducing the famous cooling Betel Paan mint aroma.",
     899, 1150, "S投影 Hookah Herbals", "domestic-tobacco", "1527281400680-8598f3583b3a_paanraas",
     ["tobacco", "domestic", "herbal-hookah", "paan-raas", "nicotine-free", "afzal-style"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Mumbai, Maharashtra", "Base": "Pure Crushed Sugar Cane & Herbal Molasses", "HSN": "2403", "Statutory_Age": "18+"}),

    ("Moradabad Cast Brass Handheld Travelling Chillum Pipe",
     "Pocket-sized engraved brass smoking pipe with internal heat baffle and natural stone stone filter.",
     899, 1199, "Moradabad Brass Craft", "domestic-tobacco", "1527281400680-8598f3583b3a_brasspocketchillum",
     ["tobacco", "domestic", "chillum", "brass-pipe", "pocket-pipe", "moradabad"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Moradabad, Uttar Pradesh", "Length": "5.5 inches Solid Heavy Cast Brass", "HSN": "9614", "GST_Rate": "18%"}),

    ("Organic Unbleached Hemp Rolling Papers King Size (Pack of 24 Booklets)",
     "100% organic Indian Himalayan hemp paper with natural Arabic gum seal line, ultra-thin and slow-burning.",
     1200, 1500, "Himalayan Hemp Collective", "domestic-tobacco", "1527281400680-8598f3583b3a_hemppapers",
     ["tobacco", "domestic", "rolling-papers", "hemp-paper", "unbleached", "himalayan-hemp"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Uttarakhand, India", "Gum": "100% Natural Organic Acacia Tree Gum", "HSN": "4813", "GST_Rate": "18%"}),

    ("Handmade Leather 3-Finger Travel Cigar Case with Stainless Cutter",
     "Saddle-stitched vegetable-tanned buffalo leather pocket case lined with Spanish cedar veneer, includes integrated guillotine cutter.",
     2799, 3600, "Kanpur Leather Guild", "domestic-tobacco", "1527281400680-8598f3583b3a_leathercigarcase",
     ["tobacco", "domestic", "cigar-case", "leather-case", "spanish-cedar", "travel-cigar"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Kanpur, Uttar Pradesh", "Lining": "Natural Spanish Cedar Humidity Locking Lining", "HSN": "4202", "GST_Rate": "18%"}),

    ("Natural Khari Baoli Paan Chutney Sweet Tobacco Mixture (250g Jar)",
     "Traditional Delhi 6 artisanal sweetened tobacco delicacy seasoned with saffron, silver vark, menthol, and crushed spices.",
     1450, 1850, "Chandni Chowk Perfumers", "domestic-tobacco", "1527281400680-8598f3583b3a_paanchutney",
     ["tobacco", "domestic", "paan-tobacco", "chandni-chowk", "khari-baoli", "heritage-spice"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Old Delhi 6", "Packaging": "Airtight Glass Jar Sealed with Wax Stamp", "HSN": "2403", "Statutory_Age": "18+"}),

    ("Cast Iron Vintage Floor Standing Cigar Ashtray 28-inch",
     "Heavy Victorian cast iron pedestal ashtray with weighted stability base and antique bronze weather-resistant patina.",
     4200, 5200, "Howrah Iron Foundry", "domestic-tobacco", "1527281400680-8598f3583b3a_floorstandashtray",
     ["tobacco", "domestic", "ashtray", "floor-ashtray", "cast-iron", "vintage", "cigar-lounge"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Howrah, West Bengal", "Weight": "5.4 kg Solid Cast Grey Iron", "HSN": "7323", "GST_Rate": "18%"}),

    ("Afzal Flavoured Hookah Molasses Bombay Pan Masala (Box of 10x50g)",
     "Refreshing blend of betel leaf, gulkand, menthol, and floral attar for smooth thick white hookah clouds.",
     1100, 1400, "Sopariwala Exports Afzal", "domestic-tobacco", "1527281400680-8598f3583b3a_afzalpanmasala",
     ["tobacco", "domestic", "hookah", "afzal", "bombay-pan-masala", "shisha-tobacco"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Mumbai, Maharashtra", "Quantity": "10 Individual 50g Fresh Foil Packs", "HSN": "2403", "Statutory_Age": "18+"}),

    ("Handmade Brass Cigar Rest & Punch Combo Keychain Tool",
     "Solid machined brass bullet tool with twist-out 8mm circular cigar punch cutter and curved tabletop cigar cradle rest.",
     1299, 1699, "Moradabad Brass Craft", "domestic-tobacco", "1527281400680-8598f3583b3a_cigarrestpunch",
     ["tobacco", "domestic", "cigar-punch", "cigar-rest", "brass-tool", "edc-accessories"],
     {"Category": "Liquor & Tobacco", "Origin_Type": "Domestic", "Origin": "Moradabad, Uttar Pradesh", "Metal": "Solid Machined Hexagonal Brass Rod", "HSN": "8205", "GST_Rate": "18%"})
]

LIQUOR_TOBACCO_ITEMS = IMPORTED_ITEMS + DOMESTIC_ITEMS

