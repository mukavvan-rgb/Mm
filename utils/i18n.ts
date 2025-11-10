
const translations = {
  // General
  loading: 'جارٍ تحميل الصفقات...',
  errorLoading: 'خطأ في تحميل الصفقات:',
  trade: 'صفقة',
  start: 'البداية',
  initial: 'أولي',
  current: 'الحالي',
  equity: 'رأس المال',

  // Header
  headerTitle: 'Street Trade Tracker',
  headerTitleAccent: 'Whales',
  import: 'استيراد',
  export: 'تصدير',
  exportAsCsv: 'تصدير كملف CSV',
  exportAsXlsx: 'تصدير كملف XLSX',
  addTrade: 'إضافة صفقة',
  // Dashboard
  dashboard: 'لوحة التحكم',
  refreshPrices: 'تحديث الأسعار',
  refreshing: 'جارٍ التحديث...',
  totalPnl: 'إجمالي الربح/الخسارة',
  pnlHelpText: 'صافي الربح والخسارة الكلي',
  winRate: 'معدل النجاح',
  winRateHelpText: 'صفقات مغلقة',
  openTrades: 'الصفقات المفتوحة',
  openTradesHelpText: 'المراكز النشطة حالياً',
  totalTrades: 'إجمالي الصفقات',
  totalTradesHelpText: 'جميع المراكز المسجلة',
  avgEntryPrice: 'متوسط سعر الدخول',
  avgEntryPriceHelpText: 'متوسط التكلفة المرجح بالكمية',
  equityCurve: 'منحنى رأس المال',
  equityCurveEmptyTitle: 'سيظهر منحنى رأس المال الخاص بك هنا.',
  equityCurveEmptyDesc: 'أغلق الصفقات أو افتح مراكز جديدة لتتبع نمو محفظتك.',
  // Trade List
  openTradesTitle: 'الصفقات المفتوحة',
  closedTradesTitle: 'الصفقات المغلقة',
  selectAll: 'تحديد الكل',
  noOpenTrades: 'لا توجد صفقات مفتوحة.',
  noClosedTrades: 'لا توجد صفقات مغلقة بعد.',
  // Trade Card
  pnl: 'الربح/الخسارة',
  livePrice: 'السعر الحالي',
  entryCost: 'الدخول / التكلفة',
  target: 'الهدف',
  stopLoss: 'وقف الخسارة',
  statusOpen: 'مفتوحة',
  statusProfit: 'ربح',
  statusLoss: 'خسارة',
  statusUnknown: 'غير معروف',
  viewOnDexScreener: 'عرض على DexScreener',
  // Add/Edit Modal
  editTradeTitle: 'تعديل الصفقة',
  addTradeTitle: 'إضافة صفقة جديدة',
  scanTokenLabel: 'مسح عنوان العملة/الزوج',
  scanTokenPlaceholder: 'الصق العنوان هنا للتعبئة التلقائية...',
  scanTokenNotFound: 'لم يتم العثور على العملة أو الزوج. يرجى التحقق من العنوان.',
  scanTokenError: 'حدث خطأ أثناء جلب بيانات العملة.',
  tokenAddressLabel: 'عنوان عقد العملة',
  tokenAddressPlaceholder: 'مثال: ...0x (يتم ملؤه تلقائيًا)',
  entryPriceLabel: 'سعر الدخول (USD)',
  quantityLabel: 'الكمية',
  targetPriceLabel: 'سعر الهدف (USD)',
  stopLossLabel: 'وقف الخسارة (USD)',
  dateLabel: 'التاريخ',
  notesLabel: 'ملاحظات',
  notesPlaceholder: 'مثال: سبب الدخول، ظروف السوق...',
  cancel: 'إلغاء',
  saveTrade: 'حفظ الصفقة',
  // Validation errors
  tokenRequired: 'عنوان العملة مطلوب',
  entryPriceRequired: 'سعر دخول صالح مطلوب',
  targetPriceRequired: 'سعر هدف صالح مطلوب',
  stopLossRequired: 'وقف خسارة صالح مطلوب',
  quantityRequired: 'كمية صالحة مطلوبة',
  // Token Preview Card
  addToTrade: 'إضافة للصفقة',
  price: 'السعر',
  change24h: 'تغير 24 ساعة',
  volume24h: 'حجم 24 ساعة',
  liquidity: 'السيولة',
  // Bulk Action Bar
  selected: 'محدد',
  deselectAll: 'إلغاء تحديد الكل',
  closeSelected: 'إغلاق المحدد',
  delete: 'حذف',
  // Import Modal
  importTitle: 'استيراد الصفقات من CSV',
  importInstructionsTitle: 'تعليمات تنسيق CSV:',
  importInstruction1: 'يجب أن يستخدم الملف نفس الأعمدة الموجودة في القالب تمامًا.',
  importInstruction2: 'يمكنك تصدير صفقاتك الحالية وتعديل الملف وإعادة استيراده.',
  importInstruction3: 'يجب أن يكون عمود التاريخ بتنسيق ISO 8601.',
  importInstruction4: "يجب أن يكون عمود الحالة أحد القيم: 'open', 'closed-profit', أو 'closed-loss'.",
  downloadTemplate: 'تنزيل قالب CSV',
  selectCsvFile: 'اختر ملف CSV',
  parsingFile: 'جارٍ تحليل الملف...',
  importSuccess: 'صفقات صالحة تم العثور عليها.',
  importReady: 'جاهزة للاستيراد.',
  importButton: 'استيراد',
  // Confirmations
  deleteConfirm: (count: number) => `هل أنت متأكد أنك تريد حذف ${count} من الصفقات المحددة؟`,
  closeConfirm: (count: number) => `هل أنت متأكد أنك تريد إغلاق ${count} من الصفقات المفتوحة بناءً على سعرها الحالي؟ هذا الإجراء لا يمكن التراجع عنه.`,
  noTradesToClose: 'لم يتم تحديد صفقات مفتوحة ببيانات سعر حالية لإغلاقها.',
  // Footer
  footerText: (year: number) => `© ${year} Whales Street Trade Tracker. جميع الحقوق محفوظة.`,
};

type TranslationKey = keyof typeof translations;

export const t = (key: TranslationKey, ...args: any[]): string => {
    const translation = translations[key];
    if (typeof translation === 'function') {
        // @ts-ignore
        return translation(...args);
    }
    return translation || key;
};