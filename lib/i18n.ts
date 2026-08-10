// Pure i18n core — no React, no DB, so the node test runner can load it.
//
// The site ships one language: English. The dictionary is a flat key → string
// map; `t(key, vars)` returns the English string and interpolates `{var}`
// placeholders. The `lang` parameter is kept in the public signatures for
// call-site compatibility, but every code path resolves to English.

export type Lang = "en";

export const LANGS: Lang[] = ["en"];
export const DEFAULT_LANG: Lang = "en";

export function isLang(v: unknown): v is Lang {
  return v === "en";
}

/** Coerce any input to the single supported language (English). */
export function sanitizeLang(_v: unknown): Lang {
  return DEFAULT_LANG;
}

export function dirFor(_lang: Lang): "ltr" {
  return "ltr";
}

/** Native speech code for the Web Speech API (voice search / read-aloud). */
export function speechCode(_lang: Lang): string {
  return "en-US";
}

// ---- Dictionary -------------------------------------------------------------

type Entry = string;

const D: Record<string, Entry> = {
  // --- Navigation / header ---
  "nav.home": "Home",
  "nav.tools": "Tools",
  "nav.blog": "Blog",
  "nav.about": "About",
  "nav.contact": "Contact Us",
  "nav.cookingBlog": "Cooking Blog",
  "nav.aboutCookchase": "About CookChase",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",
  "nav.myAccount": "My account",
  "nav.myFavorites": "My favorites",
  "nav.exploreTools": "Explore Tools",
  "nav.searchPlaceholder": "Search tools, articles…",
  "nav.menu": "Menu",
  "nav.toggleMenu": "Toggle menu",
  "nav.signedInAs": "Signed in as {email}",

  // --- Easy / Compact mode toggles ---
  "mode.easy": "Easy mode",
  "mode.easyOn": "Easy mode is on — turn it off",
  "mode.easyOff": "Easy mode — bigger text, clearer colors",
  "mode.easyOnTitle": "Easy mode is on. Bigger text, higher contrast, read-aloud help.",
  "mode.easyOffTitle": "Turn on easy mode: bigger text, higher contrast and read-aloud help.",
  "mode.compact": "Compact",
  "mode.compactOn": "Compact mode is on — turn it off",
  "mode.compactOff": "Compact mode — denser layout, more tools per screen",
  "mode.compactOnTitle": "Compact mode is on. Smaller spacing and more tools per screen.",
  "mode.compactOffTitle": "Turn on compact mode: tighter spacing and more tools per screen.",

  // --- Search ---
  "search.placeholder": "Search tools, articles…",
  "search.clear": "Clear search",
  "search.byVoice": "Search by voice",
  "search.stopVoice": "Stop voice search",
  "search.listening": "Listening… speak now",
  "search.suggestions": "Search suggestions",
  "search.searching": "Searching…",
  "search.noResults": "No results for “{q}”. Try “timer”, “cost” or “meal”.",
  "search.tools": "Tools",
  "search.articles": "Articles",
  "search.seeAll": "See all {n} results for “{q}”",
  "search.micBlocked": "Microphone blocked — allow it in your browser to search by voice.",
  "search.noSpeech": "No speech heard — try again.",
  "search.network": "Voice search needs an internet connection.",
  "search.unavailable": "Voice search isn't available right now.",

  // --- Favorites ---
  "fav.save": "Save to favorites",
  "fav.saved": "Saved to favorites",
  "fav.remove": "Remove from favorites",

  // --- Tool cards ---
  "tool.featured": "Featured",
  "tool.open": "Open",
  "tool.commentCount": "{n} comment",
  "tool.commentCountPlural": "{n} comments",
  "tool.approvedComment": "{n} approved comment",
  "tool.approvedCommentPlural": "{n} approved comments",
  "tool.totalViews": "{n} total view",
  "tool.totalViewsPlural": "{n} total views",
  "tool.freeForever": "Free forever · No sign-up",

  // --- Share ---
  "share.share": "Share",
  "share.onFacebook": "Share on Facebook",
  "share.onX": "Share on X",
  "share.onPinterest": "Pin on Pinterest",
  "share.onLinkedIn": "Share on LinkedIn",
  "share.byEmail": "Share by email",
  "share.copyLink": "Copy link",

  // --- Comments ---
  "comments.title": "Comments",
  "comments.beFirst": "Be the first to share your thoughts on this {type}.",
  "comments.leave": "Leave a comment",
  "comments.moderated": "Share a tip, a question or your result. Comments are moderated.",
  "comments.name": "Name",
  "comments.email": "Email (optional)",
  "comments.notified": "Add your email to get notified when someone replies to you.",
  "comments.comment": "Comment",
  "comments.post": "Post comment",
  "comments.posting": "Posting…",
  "comments.postAnother": "Post another",
  "comments.thanks": "Thanks for commenting!",
  "comments.approval": "Your comment will appear here once it's approved.",
  "comments.reply": "Reply",
  "comments.replyTo": "Reply to {name}",
  "comments.yourName": "Your name",
  "comments.replyPlaceholder": "Write your reply…",
  "comments.postReply": "Post reply",
  "comments.cancel": "Cancel",
  "comments.replySubmitted": "Reply submitted",
  "comments.replyWillAppear": "Your reply to {name} will appear here once it's approved.",
  "comments.done": "Done",
  "comments.inReplyTo": "in reply to",
  "comments.like": "Like",
  "comments.likes": "Likes",
  "comments.removeLike": "Remove your like",
  "comments.likeThis": "Like this comment",
  "comments.admin": "Admin",
  "comments.website": "Website",
  "comments.errorGeneric": "Something went wrong. Please try again.",
  "comments.errorNetwork": "Network error — please try again.",
  "comments.typeTool": "tool",
  "comments.typePage": "page",
  "comments.typeArticle": "article",
  "comments.typeCategory": "category page",

  // --- Guide feedback ---
  "guide.wasHelpful": "Was this guide helpful?",
  "guide.yes": "Yes, thanks",
  "guide.needsWork": "Needs work",
  "guide.thanksHelped": "Thanks — glad the guide helped.",
  "guide.thanksClearer": "Thanks — the guide could be clearer.",
  "guide.helpsImprove": "Your feedback helps us improve it.",

  // --- Voice guide (Easy mode read-aloud) ---
  "voice.aria": "Read-aloud help",
  "voice.simple": "Simple step-by-step help. You can read it or listen to it.",
  "voice.stop": "Stop reading",
  "voice.readAloud": "Read aloud",
  "voice.notSupported": "Your browser doesn't support reading aloud, but the steps below are easy to follow.",
  "voice.step": "Step {n}",
  "voice.overview": "Overview",
  "voice.question": "Question",
  "voice.answer": "Answer",
  "voice.nowReading": "Now reading:",

  // --- Ad slot ---
  "ad.advertisement": "Advertisement",
  "ad.placeholder": "Advertisement",

  // --- Footer ---
  "footer.tagline": "Free cooking tools, calculators and guides for home cooks.",
  "footer.email": "Email",
  "footer.explore": "Explore",
  "footer.allTools": "All Tools",
  "footer.categories": "Tool Categories",
  "footer.legal": "Legal",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.sitemap": "Sitemap",
  "footer.admin": "Admin",
  "footer.copyright": "© {year} {site}. All rights reserved. Cooking tools, calculators and guides for home cooks.",

  // --- Home page ---
  "home.welcome": "Welcome to CookChase",
  "home.welcomeIntro": "CookChase gives you free tools that do the kitchen math for you. Here is how to use this website.",
  "home.voiceStep1": "Pick a tool from the list below, like the Recipe Scaler or the Unit Converter.",
  "home.voiceStep2": "On the tool page, you will see boxes and buttons. Start with the “Try an example” button to see real values.",
  "home.voiceStep3": "Change the numbers to match your recipe. The answer updates automatically.",
  "home.voiceStep4": "Use the copy button to save your answer, and the comment box at the bottom to ask a question.",
  "home.statFreeTools": "Free tools",
  "home.statSignups": "Sign-ups required",
  "home.statFormulas": "Formulas explained",
  "home.statAlways": "Always available",
  "home.viewAll": "View all {n} tools",
  "home.readStory": "Read our story",
  "home.fromBlog": "From the blog",
  "home.kitchenKnowledge": "Kitchen knowledge, for free",
  "home.allArticles": "All articles",
  "home.loveTools": "Love free cooking tools? Help another cook find them.",
  "home.aboutCard1": "Kitchen math, solved",
  "home.aboutCard1d": "Scaling, converting, timing — every calculation your recipes need.",
  "home.aboutCard2": "USDA-based data",
  "home.aboutCard2d": "Temperatures and times grounded in food-safety guidelines.",
  "home.aboutCard3": "Learn the why",
  "home.aboutCard3d": "Every tool explains its formula so you cook with understanding.",
  "home.aboutCard4": "Free forever",
  "home.aboutCard4d": "No accounts, no paywalls. Just useful tools, forever.",

  // --- Tools listing ---
  "tools.eyebrow": "{n} free tools · no sign-up",
  "tools.title": "All cooking tools & calculators",
  "tools.subtitle": "Every kitchen math problem, solved. Pick a tool, do the thing, get back to cooking.",
  "tools.searchPlaceholder": "Search tools…",
  "tools.all": "All",
  "tools.browseGuide": "Browse the full {category} guide",
  "tools.noneMatched": "No tools matched your filters. Try clearing the search.",
  "tools.cantFind": "Can't find the tool you need?",
  "tools.suggestCopy": "We build new kitchen tools all the time. Tell us what would make your cooking easier and we'll consider adding it.",
  "tools.suggest": "Suggest a tool",

  // --- Tool detail page ---
  "toolDetail.home": "Home",
  "toolDetail.tools": "Tools",
  "toolDetail.about": "About this tool",
  "toolDetail.howTo": "How to use it",
  "toolDetail.howWorks": "How this tool works",
  "toolDetail.proTips": "Pro tips",
  "toolDetail.mightLike": "You might also like",
  "toolDetail.browseAll": "Browse all tools",
  "toolDetail.guideFallback1": "Choose what to change on the {tool} calculator.",
  "toolDetail.guideFallback2": "Use the numbers and menus to set your amounts.",
  "toolDetail.guideFallback3": "Press the “Try an example” button to see it work with real values.",
  "toolDetail.guideFallback4": "Read the answer in the result box on the side.",
  "toolDetail.shareTitle": "{tool} — free kitchen tool",
  "toolDetail.voiceIntro": "helps you {tagline}. Follow these simple steps.",

  // --- Shared widget chrome (used inside every tool) ---
  "widget.copy": "Copy",
  "widget.copied": "Copied",
  "widget.reset": "Reset",
  "widget.tryExample": "Try an example",
  "widget.tryExampleTitle": "Fill this tool with a real kitchen example",
  "widget.copyExample": "Copy example",
  "widget.copyExampleTitle": "Copy this example to the clipboard to share it",
  "widget.shareExample": "Share this example",
  "widget.shareExampleTitle": "Share this example and its result on social media",
  "widget.removeRow": "Remove row",
  "widget.addRow": "Add row",
  "widget.examplePrefix": "e.g.",
  "widget.tryLabel": "Try:",
  "widget.ingredient": "Ingredient",
  "widget.addIngredient": "Add ingredient",
  "widget.searchPlaceholder": "Search…",
  "widget.searchNoResults": "No matches found.",
  "widget.calculate": "Calculate",
  "widget.optional": "optional",
  "widget.clear": "Clear",
  "widget.done": "Done",
  "widget.save": "Save",
  "widget.cancel": "Cancel",
  "widget.notes": "Notes",
  "widget.total": "Total",
  "widget.result": "Result",
  "widget.preview": "Preview",
  "widget.liters": "Liters",
  "widget.milliliters": "Milliliters",
  "widget.cups": "Cups",
  "widget.grams": "Grams",
  "widget.ounces": "Ounces",
  "widget.kg": "kg",
  "widget.lb": "lb",
  "widget.minutes": "minutes",
  "widget.min": "min",
  "widget.hours": "hours",
  "widget.hr": "hr",
  "widget.seconds": "seconds",
  "widget.sec": "sec",
  "widget.days": "days",
  "widget.servings": "servings",
  "widget.people": "people",
  "widget.serving": "serving",
  "widget.perServing": "per serving",
  "widget.calories": "Calories",
  "widget.kcal": "kcal",
  "widget.protein": "Protein",
  "widget.carbs": "Carbs",
  "widget.fat": "Fat",
  "widget.fiber": "Fiber",
  "widget.sugar": "Sugar",
  "widget.sodium": "Sodium",
  "widget.cost": "Cost",
  "widget.price": "Price",
  "widget.amount": "Amount",
  "widget.unit": "Unit",
  "widget.name": "Name",
  "widget.category": "Category",
  "widget.from": "From",
  "widget.to": "To",
  "widget.temperature": "Temperature",
  "widget.time": "Time",
  "widget.weight": "Weight",
  "widget.volume": "Volume",
  "widget.level": "Level",
  "widget.high": "High",
  "widget.medium": "Medium",
  "widget.low": "Low",
  "widget.yes": "Yes",
  "widget.no": "No",
  "widget.unknown": "Unknown",
  "widget.none": "None",
  "widget.all": "All",
  "widget.daily": "Daily",
  "widget.weekly": "Weekly",
  "widget.monthly": "Monthly",
  "widget.start": "Start",
  "widget.stop": "Stop",
  "widget.pause": "Pause",
  "widget.resume": "Resume",
  "widget.add": "Add",
  "widget.remove": "Remove",
  "widget.edit": "Edit",
  "widget.delete": "Delete",
  "widget.view": "View",
  "widget.close": "Close",
  "widget.share": "Share",
  "widget.print": "Print",
  "widget.continue": "Continue",
  "widget.back": "Back",
  "widget.next": "Next",
  "widget.optionalHint": "Leave blank to use the default.",
  "widget.note": "Note",
  "widget.tip": "Tip",
  "widget.warning": "Warning",
  "widget.error": "Error",
  "widget.enterValue": "Enter a valid value to begin.",
  "widget.enterServings": "Enter valid serving numbers to begin.",
  "widget.ingredientN": "Ingredient {n}",
  "widget.was": "was {amount} {unit}",
  "widget.scaleFactor": "Scale factor",
  "widget.originalServings": "Original servings",
  "widget.desiredServings": "Desired servings",
  "widget.firstIngredient": "First ingredient",
  "widget.scaledAmount": "Scaled amount",
  "widget.originalAmount": "Original amount",
  "widget.bodyWeight": "Body weight",
  "widget.climate": "Climate",
  "widget.exercise": "Daily exercise",
  "widget.waterTarget": "Daily water target",
  "widget.inCups": "In cups",
  "widget.baseline": "Baseline (weight)",
  "widget.exerciseBonus": "Exercise bonus",
  "widget.climateBonus": "Climate bonus",
  "widget.conversionResult": "Conversion result",
  "widget.alsoEquals": "Also equals",
  "widget.usCupsApprox": "US cups (approx.)",
  "widget.categoryVolume": "Volume",
  "widget.categoryWeight": "Weight",
  "widget.mild": "Mild",
  "widget.hot": "Hot",
  "widget.veryHot": "Very hot",
  "widget.weightUnit": "Weight unit",
  "widget.bodyWeightLabel": "Body weight",
  "widget.exerciseMin": "{n} min",
  "widget.veryHotValue": "very hot",
  "widget.minutesOfActivity": "Minutes of moderate activity",
  "widget.litersValue": "Liters",
  "widget.checkHint": "pale-straw urine means you're on track. Heavy sweating (not just hot weather) needs extra electrolytes too.",
  "widget.checkLabel": "Check:",
  "widget.amountHint": "Amount",
  "widget.amountValue": "Amount",
  "widget.answer": "Answer",
  "widget.resultValue": "Result",
  "widget.categoryValue": "Category",
  "widget.fromValue": "From",
  "widget.toValue": "To",
  "widget.water": "Water",
  "widget.waterIntake": "Water Intake Calculator",
  "widget.recipeScaler": "Recipe Scaler",
  "widget.unitConverter": "Unit Converter",
  "widget.scaleHint": "Scale a birthday cake — change servings from 6 to 12 and every ingredient updates.",
  "widget.waterHint": "Check your daily water target for a 70 kg person who works out 45 minutes.",
  "widget.unitHint": "Convert 2 cups of milk to milliliters — see the result instantly.",
  "widget.factorNote": "{from} servings → {to} servings. For baking, consider reducing leavening, salt & spices to ~75%; when in doubt, weigh ingredients for the most accurate result.",
  "widget.piece": "piece",
  "widget.cupS": "cup(s)",
  "widget.tbsp": "tbsp",
  "widget.tsp": "tsp",
  "widget.g": "g",
  "widget.ml": "ml",
  "widget.l": "l",
  "widget.pinch": "pinch",
  "widget.flOz": "fl oz",
  "widget.liter": "liter",
  "widget.oz": "oz",
  "widget.flour": "Flour",
  "widget.sugarIngredient": "Sugar",
  "widget.butter": "Butter",
  "widget.eggs": "Eggs",
  "widget.milk": "Milk",
  "widget.bakingPowder": "Baking powder",
  "widget.kgShort": "kg",
  "widget.weightValue": "Weight",
  "widget.waterCalculator": "Water Intake Calculator",
  "widget.originalServingsValue": "Original servings",
  "widget.desiredServingsValue": "Desired servings",
  "widget.totalDailyWater": "Total daily water",
  "widget.servingNote": "For baking, weigh ingredients for the most accurate result.",
  "widget.servingsArrow": "{from} servings → {to} servings",
  "widget.amountPlaceholder": "Amount",
  "widget.valuePlaceholder": "Value",
  "widget.optionalPlaceholder": "optional",
  "widget.weightPlaceholder": "Weight",
  "widget.timePlaceholder": "Time",
  "widget.tempPlaceholder": "Temperature",
  "widget.amountLabel": "Amount",
  "widget.climateLabel": "Climate",
  "widget.exerciseLabel": "Daily exercise",
  "widget.toolName": "Tool name",
  "widget.resultTitle": "Result",
  "widget.noteTitle": "Note",
  "widget.hintTitle": "Hint",
  "widget.totalLabel": "Total",
  "widget.totalValue": "Total",
  "widget.baselineValue": "Baseline (weight)",
  "widget.climateBonusValue": "Climate bonus",
  "widget.cupsValue": "Cups",
  "widget.litersValueLabel": "In liters",
  "widget.inLiters": "In liters",
  "widget.inCupsValue": "In cups",
  "widget.exerciseBonusValue": "Exercise bonus",

  // --- Pro member actions (inside tools) ---
  "pro.saveExportTitle": "Save & export your results",
  "pro.saveExportCopy": "Save this calculation to your history (synced across devices) or download it as a clean, printable PDF.",
  "pro.saved": "Saved!",
  "pro.saveResult": "Save result",
  "pro.generatingPdf": "Generating PDF…",
  "pro.exportPdf": "Export PDF",
  "pro.signInSave": "Sign in to save results",
  "pro.genericError": "Something went wrong.",
  "pro.enterFirst": "Enter some values first, then save the result.",
  "pro.enterFirstPdf": "Enter some values first, then export the PDF.",
  "pro.exportFailed": "Could not export the PDF.",

  // --- Blog ---
  "blog.badge": "Free guides · no paywall",
  "blog.title": "Cooking guides & kitchen knowledge",
  "blog.subtitle": "Short, practical articles that make you a better cook — from scaling recipes to running a meal-prep week.",
  "blog.readArticle": "Read article",

  // --- Favorites page ---
  "favPage.badge": "Syncs across your devices",
  "favPage.title": "Your favorite tools",
  "favPage.subtitle": "Tap the heart on any tool to save it here. Sign in with your email to keep your favorites in sync on every device — free, no apps needed.",

  // --- Search page ---
  "searchPage.title": "Search",
  "searchPage.resultsFor": "Search results for",
  "searchPage.found": "Found {n} match",
  "searchPage.foundPlural": "Found {n} matches",
  "searchPage.noMatches": "No matches found.",
  "searchPage.empty": "Type a keyword above — try “timer”, “cost”, “meal” or “substitute” to find tools and articles.",
  "searchPage.noResults": "No results for “{q}”",
  "searchPage.tryDifferent": "Try a different keyword, or explore our popular tools and cooking guides.",
  "searchPage.tip": "Tip: filter tools by category on the tools page",
  "searchPage.inType": " in {type}",
  "searchPage.inCategory": " in {category}",
  "searchPage.sortedByPopular": ", sorted by popularity",
  "searchPage.filterAll": "All types",
  "searchPage.filterTools": "Tools only",
  "searchPage.filterArticles": "Articles only",
  "searchPage.sortRelevance": "Relevance",
  "searchPage.sortPopular": "Popular",

  // --- Account / auth ---
  "account.signInTitle": "Sign in to manage your account",
  "account.signInCopy": "Sign in to see your synced favorites, change your password, manage your devices and more.",
  "account.forgotPassword": "Forgot password?",
  "account.preferences": "Preferences",
  "account.preferencesCopy": "Your choices follow you on every device when you're signed in — the tools and the site use them automatically.",
  "account.units": "Measurement units",
  "account.unitsCopy": "Metric (grams, °C) or imperial (ounces, °F) for tool results.",
  "account.metric": "metric",
  "account.imperial": "imperial",

  // --- Categories (DB values → localized) ---
  "cat.Kitchen Helpers": "Kitchen Helpers",
  "cat.Cooking Guides": "Cooking Guides",
  "cat.Baking": "Baking",
  "cat.Nutrition & Health": "Nutrition & Health",
  "cat.Meat & Seafood": "Meat & Seafood",
  "cat.Drinks": "Drinks",
  "cat.Planners": "Planners",
  "cat.Calculators": "Calculators",
  "cat.Meal Planning": "Meal Planning",

  // --- About page ---
  "about.metaTitle": "About CookChase",
  "about.metaDesc": "Learn about CookChase and its free cooking tools.",
  "about.eyebrow": "About us",

  // --- Contact page ---
  "contact.metaTitle": "Contact CookChase",
  "contact.metaDesc": "Get in touch with the CookChase team.",
  "contact.eyebrow": "Contact",
  "contact.sendTitle": "Send us a message",
  "contact.sendCopy": "Fill this in and we'll get back to you within 2 business days — or write to {email} directly.",
  "contact.yourName": "Your name",
  "contact.yourEmail": "Your email",
  "contact.subject": "Subject",
  "contact.subjectPlaceholder": "Tool suggestion, correction…",
  "contact.message": "Message",
  "contact.sendMessage": "Send message",
  "contact.sending": "Sending…",
  "contact.sentOk": "Message sent — thank you! We'll get back to you within 2 business days.",
  "contact.sendFailed": "Could not send your message. Please try again or email us directly.",
  "contact.networkError": "Could not reach the server. Please try again or email us directly.",
  "contact.writeTo": "Or write to {email} directly.",

  // --- Legal pages ---
  "legal.privacyTitle": "Privacy Policy — CookChase",
  "legal.privacyDesc": "How CookChase handles your data.",
  "legal.termsTitle": "Terms of Service — CookChase",
  "legal.termsDesc": "The simple rules for using CookChase.",

  // --- Blog article ---
  "blog.backToArticles": "Back to all articles",

  // --- Category hub pages ---
  "hub.freeTools": "{n} free tools · no sign-up",
  "hub.toolsHeading": "{category} tools",
  "hub.empty": "We're still building tools for this category — check back soon.",
  "hub.howWorks": "How these tools work",
  "hub.faqTitle": "Frequently asked questions",
  "hub.moreCategories": "Explore more categories",
  "hub.browseAll": "Browse all tools",
  "hub.shareTitle": "{title} — CookChase",

  // --- Live FAQ (DynamicFAQ on tool pages) ---
  "faqLive.followInputs": "Answers follow your inputs",
  "faqLive.explainer": "These questions answer themselves with the values you entered above — change the numbers and the answers update instantly."
};

/** Localized category label (DB stores English names). */
export function tCategory(lang: Lang, category: string): string {
  return t(lang, `cat.${category}`) || category;
}

/**
 * Translate a key. `vars` interpolate `{name}` placeholders. Missing keys
 * return the key itself so callers never see a blank string. The site is
 * English-only; the `lang` argument is accepted for call-site compatibility.
 */
export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let out: string = D[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

/** True when a key exists in the dictionary (used by tests/editor tools). */
export function hasKey(key: string): boolean {
  return Boolean(D[key]);
}

/** Every dictionary key — used by tests/editor tooling. */
export function dictionaryKeys(): string[] {
  return Object.keys(D);
}

/** The dictionary — exported for tooling (read-only use). */
export const dictionary: Record<string, Entry> = D;
