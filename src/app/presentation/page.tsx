"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Hospital,
  UserCheck,
  Building2,
  Smartphone,
  Siren,
  Database,
  Lock,
  Cpu,
  CheckCircle2,
  Activity,
  Play,
  Sparkles,
  Award,
  Network,
  GraduationCap,
  ShoppingBag,
  Briefcase,
  HeartPulse,
  ExternalLink,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  KeyRound,
  FileCheck2,
  ArrowUpLeft,
  BookOpen,
  Presentation,
  Copy,
  Check,
} from "lucide-react";
import { BRAND_LOGO_URL } from "@/lib/assets";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/* ============================================================================
   COMPREHENSIVE DATA ENCYCLOPEDIA — EVERY ROLE, SCREEN, FLOW, TABLE & MINISTRY
   ============================================================================ */

export interface DetailedScreenSpec {
  nameAr: string;
  nameEn: string;
  route: string;
  purpose: string;
  inputsAndSearch: string[];
  actionsAndButtons: string[];
  apisUsed: string[];
  dbTables: string[];
  realTimeImpact: string;
}

export interface RoleEncyclopedia {
  id: string;
  number: string;
  titleAr: string;
  titleEn: string;
  roleEnum: string;
  demoEmail: string;
  demoPassword: string;
  accentColor: string;
  badgeBg: string;
  overview: string;
  keyResponsibilities: string[];
  endToEndFlowSummary: string[];
  screens: DetailedScreenSpec[];
}

const ROLES_ENCYCLOPEDIA: RoleEncyclopedia[] = [
  {
    id: "doctor",
    number: "01",
    titleAr: "الطبيب البشري والاستشاري (بوابة العيادات والأمان الإكلينيكي)",
    titleEn: "Physician & Clinical Decision Support Portal",
    roleEnum: "DOCTOR",
    demoEmail: "doctor@mnis.demo",
    demoPassword: "MnisDemo#2026!Secure",
    accentColor: "border-primary text-primary",
    badgeBg: "bg-primary text-on-primary",
    overview:
      "المسؤول الأول عن التشخيص الطبي، فحص التاريخ المرضي الموحد للمواطن، كتابة وتوقيع الروشتات الإلكترونية (مع فحص الحساسية والتداخلات الدوائية آلياً)، طلب التحاليل المعملية، إرسال الإحالات الشبكية للمستشفيات والطوارئ، واعتماد تجديد العلاج المزمن عن بُعد.",
    keyResponsibilities: [
      "البحث اللحظي عن أي مريض في الطابور أو على مستوى الجمهورية بالاسم، الرقم القومي (14 رقماً أو جزء منه)، الكود الطبي الوطني (MTI)، أو رقم التذكرة.",
      "مناداة المريض التالي بأمان تام عند عمل عدة أطباء في نفس الوقت (Atomic Queue Call) أو إدراج مريض جديد مباشرة في طابور العيادة.",
      "الاطلاع داخل غرفة الكشف على السجل الطبي الموحد للمريض: الروشتات السابقة، الحصص الشهرية المزمنة النشطة، نتائج تحاليل المعمل بالأرقام، وصور الأشعة التشخيصية (PACS).",
      "الاستفادة من محرك الأمان الإكلينيكي اللحظي (CDS) الذي يمنع وصف دواء يتعارض مع حساسية المريض (مثل البنسلين) أو يسبب تداخلاً دوائياً خطيراً (مثل Warfarin + Aspirin).",
      "توقيع الروشتة رقمياً ببصمة مشفرة (SHA-256) وإرسالها لطابور الصيدلية مع تخصيص حصة شهرية تلقائية إذا كان التشخيص مرضاً مزمناً.",
      "إرسال طلبات التحاليل الفورية للمعمل المركزي وإنشاء الإحالات الشبكية (التي تتحول أوتوماتيكياً لحالة طوارئ حرجة في المستشفى عند اختيار CRITICAL).",
      "فك قفل السجل الطبي الكامل للمريض عبر كود المشاركة المؤقت (10 أحرف صالحة لمدة 10 دقائق) الذي يولده المواطن من تطبيقه.",
      "اعتماد أو رفض طلبات تجديد الروشتات المزمنة المرسلة من تطبيق المواطن، واعتماد التنبيهات السريرية الواردة من المعمل (Condition Flags) لإضافتها رسمياً لملف المريض.",
    ],
    endToEndFlowSummary: [
      "١. يدخل الطبيب إلى (/doctor/queue) فيشاهد المرضى مرتبين (حالات الطوارئ أولاً ثم بأسبقية الحضور) مع ظهور كود MTI والرقم القومي لكل مريض.",
      "٢. يبحث الطبيب بالرقم القومي أو MTI أو يضغط «مناداة المريض التالي» ثم يضغط «بدء الكشف» فتنتقل حالة الزيارة إلى IN_CONSULTATION وتفتح غرفة الكشف (/doctor/consultation).",
      "٣. في غرفة الكشف، يراجع الطبيب نتائج تحاليل المريض وأشعته السابقة في البطاقات العلوية، ثم يكتب التشخيص وكود ICD-10 ويضيف الأدوية من الدليل الدوائي المصري.",
      "٤. يفحص النظام تلقائياً تعارض الأدوية مع حساسيات المريض المسجلة والتداخلات الدوائية، ثم يضغط الطبيب «توقيع وإرسال للصيدلية».",
      "٥. تنتقل الروشتة في التو واللحظة إلى الصيدلية (/pharmacy/rx-verification و /pharmacy/dispensing-queue)، وتُنشأ حصة شهرية في (/pharmacy/chronic-allowances) وتظهر في تطبيق المواطن!",
    ],
    screens: [
      {
        nameAr: "١. طابور انتظار العيادة الذكي",
        nameEn: "Clinic Queue Management",
        route: "/doctor/queue",
        purpose: "إدارة قائمة انتظار المرضى بالعيادة مع أولوية الطوارئ والبحث الشامل بالرقم القومي و MTI.",
        inputsAndSearch: [
          "شريط بحث ذكي يقبل: الاسم (عربي/إنجليزي)، الرقم القومي (14 رقماً)، الكود الوطني MTI، أو رقم التذكرة (A-XX).",
          "نافذة إدراج مواطن في الطابور: بحث عن مواطن + سبب الزيارة (عربي/إنجليزي) + خيار حالة طوارئ حرجة.",
        ],
        actionsAndButtons: [
          "زر «مناداة المريض التالي» (يختار أول مريض طوارئ أو أقدم مريض منتظر ذرياً).",
          "زر «إدراج مواطن بالطابور» لإصدار تذكرة كشف فورية.",
          "زر «بدء الكشف» على كل بطاقة وداخل النافذة المنبثقة (يحول التذكرة إلى IN_CONSULTATION ويفتح غرفة الكشف).",
          "أزرار «إنهاء الكشف (Completed)» و«لم يحضر (No-show)».",
        ],
        apisUsed: ["GET /v1/queue", "POST /v1/queue/call-next", "POST /v1/queue", "PATCH /v1/queue/:id/status"],
        dbTables: ["Visit", "Patient", "AuditLog"],
        realTimeImpact: "تحديث شاشات الانتظار وتحميل ملف المريض تلقائياً في غرفة الكشف الطبي.",
      },
      {
        nameAr: "٢. غرفة الكشف الطبي ومحرك الأمان الدوائي",
        nameEn: "Clinical Consultation & DDI Safety Room",
        route: "/doctor/consultation",
        purpose: "الشاشة المركزية للكشف على المريض، استعراض سجله الموحد، كتابة الروشتة وفحص أمانها، طلب التحاليل، وإرسال الإحالات.",
        inputsAndSearch: [
          "محدد مرضى الطابور الحالي + محرك بحث حر لاستدعاء أي مواطن في الجمهورية بالرقم القومي أو MTI أو الاسم.",
          "حقول التشخيص الإكلينيكي (عربي + إنجليزي) وكود التصنيف الدولي للأمراض (ICD-10) وخيار «مرض مزمن».",
          "نافذة إضافة دواء: اختيار من الدليل الدوائي المصري أو كتابة الاسم والجرعة والشكل والتكرار والمدة والكمية.",
          "محدد طلب التحليل المعملي الفوري (CBC, HbA1c, Lipid Profile, Troponin-I STAT).",
          "نموذج الإحالة الشبكية (الجهة المستقبلة: مستشفى/معمل/صيدلية + درجة الاستعجال: اعتيادي/طوارئ حرجة + الملاحظة الإكلينيكية).",
        ],
        actionsAndButtons: [
          "زر «إضافة دواء» مع تشغيل محرك فحص الحساسية والتداخلات الدوائية (Allergy & DDI Engine) لحظياً.",
          "زر «توقيع وإرسال للصيدلية» (يولد ختم SHA-256 ويرسل الروشتة للصيدلية ويخصص الحصة المزمنة).",
          "زر «إرسال العينة لقائمة انتظار المعمل».",
          "زر «إرسال إحالة شبكية».",
        ],
        apisUsed: [
          "GET /v1/patients/:id",
          "POST /v1/prescriptions",
          "POST /v1/prescriptions/:id/sign",
          "POST /v1/lab/samples",
          "POST /v1/referrals",
        ],
        dbTables: ["Prescription", "PrescriptionItem", "ChronicAllowance", "LabSample", "Referral", "ErCase", "AuditLog"],
        realTimeImpact:
          "تظهر الروشتة فوراً في الصيدلية، وتظهر العينة في المعمل، وتتحول الإحالة الحرجة تلقائياً إلى حالة طوارئ في المستشفى، ويتحدث تطبيق المواطن.",
      },
      {
        nameAr: "٣. تجديد الروشتات المزمنة عن بُعد",
        nameEn: "Remote Chronic Prescription Renewals",
        route: "/doctor/renewals",
        purpose: "مراجعة طلبات تجديد الأدوية المزمنة المرسلة من المواطنين عبر تطبيق الموبايل واعتمادها دون حضور المريض.",
        inputsAndSearch: ["ملاحظة الطبيب للمواطن عند القبول أو الرفض."],
        actionsAndButtons: [
          "زر «موافقة وتجديد الروشتة» (ينشئ مسودة روشتة جديدة ويرسل إشعاراً للمواطن).",
          "زر «رفض الطلب» مع إرسال سبب الرفض لهاتف المواطن.",
        ],
        apisUsed: ["GET /v1/renewals", "POST /v1/renewals/:id/approve", "POST /v1/renewals/:id/reject"],
        dbTables: ["RenewalRequest", "Prescription", "PushNotification", "AuditLog"],
        realTimeImpact: "يصل إشعار فوري (RENEWAL_DECIDED) لتطبيق المواطن وتُجهز الروشتة الجديدة للصرف.",
      },
      {
        nameAr: "٤. السجل الطبي المشترك بكود المواطن",
        nameEn: "Citizen Share-Code Record Unlock",
        route: "/doctor/shared-record",
        purpose: "فك قفل التاريخ المرضي الكامل للمواطن باستخدام الكود المؤقت (10 أحرف) الذي يولده المواطن من تطبيقه.",
        inputsAndSearch: ["حقل إدخال كود المشاركة المؤقت المكون من 10 أحرف (صالح لمدة 10 دقائق)."],
        actionsAndButtons: ["زر «عرض السجل الطبي» لاسترجاع كافة الزيارات والروشتات والتحاليل السابقة."],
        apisUsed: ["POST /v1/shares/redeem"],
        dbTables: ["ShareToken", "Patient", "Prescription", "LabSample", "Visit", "AuditLog"],
        realTimeImpact: "يُسجل اطلاع الطبيب في سجل الرقابة السيادي الذي يراه المواطن في تطبيقه.",
      },
      {
        nameAr: "٥. أرشيف الروشتات الإلكترونية",
        nameEn: "E-Prescriptions History",
        route: "/doctor/e-prescriptions",
        purpose: "استعراض ومراجعة جميع الروشتات الصادرة وحالة صرفها في الصيدلية.",
        inputsAndSearch: ["بحث بالاسم، الرقم القومي (14 رقماً)، كود MTI، التشخيص، أو كود الروشتة."],
        actionsAndButtons: [
          "الضغط على أي روشتة لعرض الأدوية والجرعات بالتفصيل.",
          "زر «فتح غرفة الكشف لهذا المريض» لكتابة روشتة جديدة له مباشرة.",
        ],
        apisUsed: ["GET /v1/prescriptions"],
        dbTables: ["Prescription", "PrescriptionItem"],
        realTimeImpact: "متابعة حية لما تم صرفه أو رفضه في الصيدلية.",
      },
      {
        nameAr: "٦. طلبات ونتائج المعمل المركزي",
        nameEn: "Lab Orders & Verified Results",
        route: "/doctor/lab-orders",
        purpose: "متابعة حالة العينات المرسلة للمعمل واستعراض جداول النتائج الرقمية المعتمدة وطلب تحاليل جديدة.",
        inputsAndSearch: [
          "بحث بالاسم، الرقم القومي (14 رقماً)، كود MTI، أو باركود العينة.",
          "نافذة طلب تحليل جديد لمواطن مع تحديد الأولوية (ROUTINE / URGENT / STAT).",
        ],
        actionsAndButtons: [
          "زر «طلب تحليل معملي جديد».",
          "زر «النتائج» لفتح جدول المؤشرات الرقمية والمدى المرجعي وأعلام الخطر (NORMAL / HIGH / LOW / CRITICAL).",
        ],
        apisUsed: ["GET /v1/lab/samples", "POST /v1/lab/samples"],
        dbTables: ["LabSample", "LabResult"],
        realTimeImpact: "ربط فوري بين عيادة الطبيب والمعمل المرجعي.",
      },
      {
        nameAr: "٧. الإحالات الشبكية واعتماد تنبيهات المعمل",
        nameEn: "Network Referrals & Clinical Condition Flags",
        route: "/doctor/referrals",
        purpose: "إدارة الإحالات الصادرة ومراجعة التنبيهات السريرية (Condition Flags) المكتشفة في المعمل لإضافتها لملف المريض.",
        inputsAndSearch: ["فلترة الإحالات والتنبيهات السريرية."],
        actionsAndButtons: [
          "زر «اعتماد وإضافة لملف المريض» على تنبيهات المعمل (يضيف الحساسية أو المرض المزمن رسمياً لسجل المواطن).",
          "زر «رفض التنبيه» أو «إلغاء الإحالة».",
        ],
        apisUsed: ["GET /v1/referrals", "DELETE /v1/referrals/:id", "PATCH /v1/lab/condition-flags/:id/review"],
        dbTables: ["Referral", "ConditionFlag", "Patient", "AuditLog"],
        realTimeImpact: "تحديث السجل الدائم للحساسيات والأمراض المزمنة للمواطن في البطاقة الذكية NFC وتطبيق الموبايل.",
      },
      {
        nameAr: "٨. جدول مواعيد الطبيب الأسبوعي",
        nameEn: "Doctor Weekly Availability Schedule",
        route: "/doctor/schedule",
        purpose: "تحديد أيام وساعات تواجد الطبيب ومدة الكشف لتغذية نظام حجز المواعيد في الاستقبال وتطبيق الموبايل.",
        inputsAndSearch: ["اليوم من الأسبوع، وقت البدء، وقت الانتهاء، ومدة الفترة الزمنية بالدقائق (مثلاً 20 دقيقة)."],
        actionsAndButtons: ["زر «إضافة/حفظ فترة عمل» وزر «حذف فترة»."],
        apisUsed: ["GET /v1/schedule/my", "POST /v1/schedule/my", "DELETE /v1/schedule/my/:id"],
        dbTables: ["DoctorSchedule", "AuditLog"],
        realTimeImpact: "تتحدث الفترات الزمنية المتاحة للحجز فوراً لدى موظف الاستقبال والمواطنين.",
      },
    ],
  },
  {
    id: "pharmacy",
    number: "02",
    titleAr: "الصيدلي الإكلينيكي وحوكمة التأمين الدوائي (بوابة الصيدلية)",
    titleEn: "Clinical Pharmacy, Chronic Quotas & UHIA Claims Portal",
    roleEnum: "PHARMACIST",
    demoEmail: "pharmacist@mnis.demo",
    demoPassword: "MnisDemo#2026!Secure",
    accentColor: "border-secondary text-secondary",
    badgeBg: "bg-secondary text-on-secondary",
    overview:
      "يتولى التحقق الإكلينيكي والتشفيري من الروشتات الموقعة، صرف الأدوية للمواطنين مع الخصم الآلي من مخزون الصيدلية، إدارة وصرف الحصص الشهرية المتكررة لأصحاب الأمراض المزمنة، وإدارة مطالبات وتسويات هيئة التأمين الصحي الشامل (UHIA).",
    keyResponsibilities: [
      "فحص الروشتات الموقعة رقمياً عبر قائمة التحقق الخماسية الإلزامية قبل السماح بصرفها.",
      "البحث الفوري في طابور الصرف بالاسم أو الرقم القومي (14 رقماً) أو كود MTI أو كود الروشتة.",
      "تنفيذ الصرف الفعلي الذي يخصم الكميات أوتوماتيكياً من مخزن الأدوية وينشئ مطالبة تأمينية (80% تغطية) ويرسل إشعاراً لهاتف المواطن.",
      "مراقبة وصرف الحصص الشهرية لأصحاب الأمراض المزمنة مع منع تجاوز الحد الشهري المقرر أو تكرار الصرف من صيدليات مختلفة.",
      "إدارة جرد مخزن الصيدلية وإضافة أصناف دوائية جديدة والتوريد الفوري للأصناف المنخفضة.",
      "إرسال مطالبات التأمين الصحي الشامل وتجميعها في حزم تسويات مالية شهرية.",
    ],
    endToEndFlowSummary: [
      "١. بمجرد توقيع الطبيب للروشتة في العيادة، تظهر في (/pharmacy/rx-verification) و(/pharmacy/dispensing-queue).",
      "٢. يراجع الصيدلي بنود الأمان الخمسة ويعتمد الروشتة (VERIFIED)، ثم يضغط «صرف الآن (Dispense)».",
      "٣. في خطوة ذرية واحدة: تتحول الروشتة إلى DISPENSED + يُخصم الرصيد من (/pharmacy/inventory) + تُنشأ مطالبة مالية في (/pharmacy/insurance-claims) + يصل إشعار لتطبيق المواطن!",
      "٤. بالنسبة للمريض المزمن: يفتح الصيدلي (/pharmacy/chronic-allowances) ويصرف الدفعة الشهرية مع تحديث شريط الاستهلاك الشهري لحظياً.",
    ],
    screens: [
      {
        nameAr: "١. قائمة صرف الروشتات الموحدة",
        nameEn: "Unified Dispensing Queue",
        route: "/pharmacy/dispensing-queue",
        purpose: "البحث الفوري عن روشتات المواطنين بالرقم القومي أو MTI والتحقق منها وصرفها.",
        inputsAndSearch: ["بحث بالاسم، الرقم القومي (14 رقماً)، كود MTI، أو كود الروشتة (#RX) + تبويب القائمة والسجل."],
        actionsAndButtons: ["زر «تحقق فوري» للروشتات الموقعة، وزر «صرف الآن» للروشتات المعتمدة."],
        apisUsed: ["GET /v1/prescriptions", "POST /v1/prescriptions/:id/verify", "POST /v1/prescriptions/:id/dispense"],
        dbTables: ["Prescription", "DrugInventory", "PharmacyClaim", "PushNotification", "AuditLog"],
        realTimeImpact: "خصم آلي من المخزن + إنشاء مطالبة تأمينية + إشعار فوري لتطبيق المواطن.",
      },
      {
        nameAr: "٢. التحقق الإكلينيكي من الروشتة قبل الصرف",
        nameEn: "Mandatory Rx Safety Verification",
        route: "/pharmacy/rx-verification",
        purpose: "مراجعة قائمة التحقق الخماسية (الهوية، الجرعة، عدم التداخل، عدم الحساسية، التوقيع) قبل اعتماد الصرف.",
        inputsAndSearch: ["قائمة التحقق الإلزامية الـ 5 + حقل سبب الرفض الإكلينيكي."],
        actionsAndButtons: ["زر «اعتماد للصرف (Approve)» وزر «رفض الروشتة (Reject)»."],
        apisUsed: ["POST /v1/prescriptions/:id/verify", "POST /v1/prescriptions/:id/reject"],
        dbTables: ["Prescription", "AuditLog"],
        realTimeImpact: "حماية المريض من أي خطأ دوائي وتوثيق اسم الصيدلي المراجع.",
      },
      {
        nameAr: "٣. إدارة وصرف حصص الأدوية المزمنة الشهرية",
        nameEn: "Monthly Chronic Medication Allowances",
        route: "/pharmacy/chronic-allowances",
        purpose: "تتبع الحصص الشهرية للمرضى المزمنين وصرف الدفعات المقررة مع حساب المتبقي وتاريخ التجديد.",
        inputsAndSearch: ["بحث عن المواطن بالاسم أو الرقم القومي أو MTI + تحديد الكمية المراد صرفها."],
        actionsAndButtons: ["زر «صرف من الحصة» وزر «تحديث الحصص»."],
        apisUsed: ["GET /v1/pharmacy/allowances/patient/:id", "POST /v1/pharmacy/allowances/dispense"],
        dbTables: ["ChronicAllowance", "AuditLog"],
        realTimeImpact: "يظهر شريط الاستهلاك المحدث فوراً في تطبيق المواطن وفي غرفة كشف الطبيب.",
      },
      {
        nameAr: "٤. جرد وإدارة مخزن الصيدلية",
        nameEn: "Pharmacy Inventory & Stock Control",
        route: "/pharmacy/inventory",
        purpose: "مراقبة الأرصدة الدوائية الفعلية، تنبيهات حد إعادة الطلب، إضافة أدوية جديدة، والتوريد الفوري.",
        inputsAndSearch: [
          "بحث باسم الدواء بالعربية أو الإنجليزية.",
          "نافذة إضافة صنف دوائي جديد (الاسم، الشكل، التركيز، الكمية، حد الطلب، السعر).",
        ],
        actionsAndButtons: ["زر «إضافة صنف دوائي جديد»، أزرار «-5» و«+25»، وزر «توريد فوري (+100)» للأصناف المنخفضة."],
        apisUsed: ["GET /v1/pharmacy/inventory", "POST /v1/pharmacy/inventory", "PATCH /v1/pharmacy/inventory/:id"],
        dbTables: ["DrugInventory", "AuditLog"],
        realTimeImpact: "تغذية محرك الذكاء الدوائي في وزارة الصحة (/analytics/drug-intelligence) بأرصدة الأدوية الاستراتيجية.",
      },
      {
        nameAr: "٥. مطالبات التأمين الصحي الشامل (UHIA)",
        nameEn: "UHIA Insurance Claims",
        route: "/pharmacy/insurance-claims",
        purpose: "مراجعة المطالبات المالية الناتجة عن صرف الروشتات (إجمالي القيمة، تغطية التأمين 80%، مساهمة المواطن 20%).",
        inputsAndSearch: ["فلترة المطالبات حسب الحالة (PENDING / SUBMITTED / SETTLED)."],
        actionsAndButtons: ["زر «إرسال المطالبة للهيئة (Submit Claim)»."],
        apisUsed: ["GET /v1/pharmacy/claims", "PATCH /v1/pharmacy/claims/:id/submit"],
        dbTables: ["PharmacyClaim", "AuditLog"],
        realTimeImpact: "تجهيز المطالبات للدخول في التسوية المالية الشهرية.",
      },
      {
        nameAr: "٦. التسويات المالية الشهرية",
        nameEn: "Monthly Financial Settlements",
        route: "/pharmacy/financial-settlement",
        purpose: "تجميع كافة مطالبات الشهر في حزمة تسوية مالية موحدة لصرف مستحقات الصيدلية من التأمين الصحي.",
        inputsAndSearch: ["اختيار السنة والشهر لتشغيل دورة التسوية."],
        actionsAndButtons: ["زر «تشغيل التسوية المالية الشهرية»."],
        apisUsed: ["GET /v1/pharmacy/settlements", "POST /v1/pharmacy/settlements/run"],
        dbTables: ["PharmacySettlement", "PharmacyClaim", "AuditLog"],
        realTimeImpact: "تحديث مؤشرات الأداء المالي لهيئة التأمين الصحي الشامل (/analytics/uhia-coverage).",
      },
    ],
  },
  {
    id: "lab",
    number: "03",
    titleAr: "أخصائي المعمل المرجعي والأشعة التشخيصية (Central Lab & PACS)",
    titleEn: "Reference Laboratory, QC & Diagnostic Radiology Portal",
    roleEnum: "LAB_TECH",
    demoEmail: "lab1@mnis.demo",
    demoPassword: "MnisDemo#2026!Secure",
    accentColor: "border-tertiary text-tertiary",
    badgeBg: "bg-tertiary text-on-tertiary",
    overview:
      "يدير دورة حياة العينات المعملية بالباركود، إدخال واعتماد النتائج الرقمية مع التقييم الآلي للقيم الحرجة، إرسال تنبيهات الأمراض والحساسية المكتشفة للطبيب، رفع صور وتقارير الأشعة التشخيصية (PACS)، وضبط جودة ومعايرة الأجهزة والكواشف.",
    keyResponsibilities: [
      "استلام العينات وتتبعها بالباركود أو الرقم القومي (14 رقماً) أو كود MTI وتمريرها عبر مراحل الفحص القياسية.",
      "إدخال نتائج التحاليل الرقمية مع حساب آلي لعلم الخطر (NORMAL / LOW / HIGH / CRITICAL) واعتمادها نهائياً.",
      "رفع تنبيه حالة مرضية أو حساسية مكتشفة (Condition Flag) للطبيب لاعتمادها في ملف المريض الدائم.",
      "رفع ومعاينة صور الأشعة التشخيصية (X-Ray, CT, MRI, Ultrasound) مع التقارير الطبية المربوطة بهوية المواطن.",
      "إدارة أجهزة المعمل وتسجيل شهادات المعايرة الدورية (QC Calibration) ومراقبة مخزون الكواشف والمحاليل.",
    ],
    endToEndFlowSummary: [
      "١. يستلم أخصائي المعمل العينة المطلوبة من الطبيب في (/lab/sample-intake) بالباركود أو الرقم القومي ويمررها إلى حالة PROCESSING.",
      "٢. يفتح (/lab/results) ويدخل القيم الرقمية للمؤشرات ثم يضغط «اعتماد النتيجة (Verify)».",
      "٣. فوراً: تظهر الأرقام والمدى المرجعي في شاشة الطبيب (/doctor/consultation و /doctor/lab-orders) ويصل إشعار فوري لهاتف المواطن!",
      "٤. في (/lab/radiology) يرفع أخصائي الأشعة صورة الفحص والتقرير، فيظهران فوراً لدى الطبيب وفي تطبيق المواطن.",
    ],
    screens: [
      {
        nameAr: "١. استلام العينات وتتبع الباركود",
        nameEn: "Sample Intake & Barcode Queue",
        route: "/lab/sample-intake",
        purpose: "استلام العينات المسحوبة وتمريرها عبر مراحل النقل والاستلام والتشغيل.",
        inputsAndSearch: ["بحث بالاسم، الرقم القومي (14 رقماً)، كود MTI، أو باركود العينة (LAB-...)."],
        actionsAndButtons: ["زر «الحالة التالية (Advance)» وزر «رفض العينة التالفة»."],
        apisUsed: ["GET /v1/lab/samples", "PATCH /v1/lab/samples/:id/status"],
        dbTables: ["LabSample", "AuditLog"],
        realTimeImpact: "تحديث حالة العينة لحظياً لدى الطبيب وتجهيزها لإدخال النتائج.",
      },
      {
        nameAr: "٢. إدخال واعتماد النتائج والتنبيهات السريرية",
        nameEn: "Lab Results Entry, Verification & Condition Flags",
        route: "/lab/results",
        purpose: "إدخال القيم الرقمية للمؤشرات المعملية، اعتمادها، ورفع تنبيهات الحساسية/الأمراض المزمنة للطبيب.",
        inputsAndSearch: [
          "حقول القيم الرقمية للمؤشرات (Value, Unit, RefLow, RefHigh).",
          "نموذج إرسال تنبيه حالة مرضية أو حساسية مكتشفة (Condition Flag) للطبيب.",
        ],
        actionsAndButtons: ["زر «حفظ النتائج»، زر «اعتماد نهائي (Verify)»، وزر «إرسال تنبيه للطبيب»."],
        apisUsed: [
          "POST /v1/lab/samples/:id/results",
          "POST /v1/lab/samples/:id/verify",
          "POST /v1/lab/condition-flags",
        ],
        dbTables: ["LabResult", "LabSample", "ConditionFlag", "PushNotification", "AuditLog"],
        realTimeImpact: "إشعار فوري لتطبيق المواطن + ظهور النتائج للطبيب + تغذية الرصد الوبائي في وزارة الصحة.",
      },
      {
        nameAr: "٣. الأشعة التشخيصية والتقارير المصورة (PACS)",
        nameEn: "Diagnostic Radiology & PACS Imaging",
        route: "/lab/radiology",
        purpose: "رفع وأرشفة ومعاينة صور الأشعة السينية والمقطعية والرنين المغناطيسي وتقاريرها.",
        inputsAndSearch: [
          "بحث عن المواطن + اختيار نوع الفحص (X-Ray / CT / MRI / Ultrasound) + العضو المفحوص + التقرير بالعربية والإنجليزية + ملف الصورة.",
        ],
        actionsAndButtons: ["زر «حفظ وإرسال للسجل الطبي»، زر «معاينة الصورة»، وزر «حذف»."],
        apisUsed: ["GET /v1/lab/radiology", "POST /v1/lab/radiology", "DELETE /v1/lab/radiology/:id"],
        dbTables: ["RadiologyUpload", "AuditLog"],
        realTimeImpact: "تظهر صورة الأشعة وتقريرها مباشرة في غرفة كشف الطبيب وفي الملخص السيادي بتطبيق المواطن.",
      },
      {
        nameAr: "٤. ضبط الجودة ومعايرة الأجهزة (QC)",
        nameEn: "Lab Instruments & QC Calibration",
        route: "/lab/qc-calibration",
        purpose: "إدارة أجهزة التحليل المعملية وتوثيق دورات المعايرة الدورية لضمان دقة النتائج.",
        inputsAndSearch: ["إضافة جهاز جديد + تسجيل نتيجة معايرة (PASS / FAIL / ADJUSTED) وملاحظات الفحص."],
        actionsAndButtons: ["زر «إضافة جهاز» وزر «تسجيل معايرة جديدة»."],
        apisUsed: ["GET /v1/lab/instruments", "POST /v1/lab/instruments", "POST /v1/lab/instruments/:id/calibrations"],
        dbTables: ["LabInstrument", "CalibrationRecord", "AuditLog"],
        realTimeImpact: "ضمان اعتماد الجودة القومي للمعمل المركزي.",
      },
      {
        nameAr: "٥. إدارة مخزون الكواشف والمحاليل",
        nameEn: "Reagents & Consumables Inventory",
        route: "/lab/reagents",
        purpose: "متابعة أرصدة الكواشف المعملية وتواريخ الصلاحية وتنبيهات نقص الرصيد.",
        inputsAndSearch: ["إضافة كاشف جديد وتحديث الكميات."],
        actionsAndButtons: ["زر «إضافة كاشف»، أزرار تعديل الرصيد، وزر «حذف»."],
        apisUsed: ["GET /v1/lab/reagents", "POST /v1/lab/reagents", "PATCH /v1/lab/reagents/:id"],
        dbTables: ["Reagent", "AuditLog"],
        realTimeImpact: "منع توقف التحاليل الحيوية بسبب نفاد الكواشف.",
      },
      {
        nameAr: "٦. تحليلات ومؤشرات أداء المعمل",
        nameEn: "Laboratory Analytics & TAT Reports",
        route: "/lab/analytics",
        purpose: "عرض مؤشرات زمن إنجاز التحاليل (TAT)، توزيع الأولويات، ونسب القيم الحرجة.",
        inputsAndSearch: ["مؤشرات تحليلية حية من قاعدة البيانات."],
        actionsAndButtons: ["تحديث واستعراض التقارير المعملية."],
        apisUsed: ["GET /v1/lab/analytics"],
        dbTables: ["LabSample", "LabResult", "Reagent", "LabInstrument"],
        realTimeImpact: "دعم قرارات إدارة المعامل المركزية بوزارة الصحة.",
      },
    ],
  },
  {
    id: "hospital",
    number: "04",
    titleAr: "طاقم المستشفى والطوارئ والعمليات وبنك الدم (Hospital Command)",
    titleEn: "Hospital Operations, ER Triage, Surgical OR & Blood Bank",
    roleEnum: "HOSPITAL_STAFF",
    demoEmail: "er@mnis.demo",
    demoPassword: "MnisDemo#2026!Secure",
    accentColor: "border-error text-error",
    badgeBg: "bg-error text-on-error",
    overview:
      "يدير العمليات الحرجة داخل المستشفيات: استقبال وفرز حالات الطوارئ (ER Triage)، إدارة خريطة الأسرة والعناية المركزة، جدولة غرف العمليات الجراحية، تنسيق تحويلات الإسعاف (123)، وإدارة بنك الدم المركزي ومعايير الجودة.",
    keyResponsibilities: [
      "فرز حالات الطوارئ حسب مقياس الخطورة العالمي (ESI Acuity 1–5) وتسجيل العلامات الحيوية وتسكين المريض في سرير متاح.",
      "إدارة حالة جميع أسرة الأقسام الداخلية والعناية المركزة (متاح، مشغول، تعقيم، محجوز، صيانة).",
      "جدولة العمليات الجراحية وربط المريض بالجراح وغرفة العمليات والسرير ونوع التخدير.",
      "استقبال وإدارة تحويلات الإسعاف والإحالات الحرجة الواردة من العيادات والمستشفيات الأخرى.",
      "إدارة بنك الدم المركزي على مستوى كل وحدة دم وفصيلتها وتاريخ صلاحيتها وصرفها للمرضى.",
    ],
    endToEndFlowSummary: [
      "١. عند وصول مصاب لقسم الطوارئ (أو إرسال إحالة CRITICAL من الطبيب)، يُسجل في (/hospital/er-triage) مع العلامات الحيوية ومستوى الخطورة.",
      "٢. يضغط طاقم الطوارئ «تسكين في سرير» ويختار سريراً متاحاً، فيتحول السرير في (/hospital/beds-icu) إلى OCCUPIED باسم المريض فوراً.",
      "٣. إذا احتاج المريض لتدخل جراحي ونقل دم، تُجدول العملية في (/hospital/surgical) وتُصرف وحدة دم مطابقة لفصيلته من (/hospital/blood-bank).",
    ],
    screens: [
      {
        nameAr: "١. فرز الطوارئ والإنعاش (ER Triage)",
        nameEn: "Emergency Room Triage & Intake",
        route: "/hospital/er-triage",
        purpose: "تسجيل حالات الطوارئ الحرجة والعلامات الحيوية وتسكين المرضى في الأسرة المتاحة.",
        inputsAndSearch: ["اختيار المريض + وسيلة الوصول + الشكوى الرئيسية + مستوى الخطورة (1-5) + العلامات الحيوية."],
        actionsAndButtons: ["زر «تسجيل حالة طوارئ جديدة» وزر «تسكين في سرير (Admit to Bed)»."],
        apisUsed: ["GET /v1/hospital/er", "POST /v1/hospital/er", "POST /v1/hospital/er/:id/admit"],
        dbTables: ["ErCase", "Bed", "AuditLog"],
        realTimeImpact: "تحديث نسبة إشغال الطوارئ والأسرة في غرفة القيادة الوطنية بوزارة الصحة.",
      },
      {
        nameAr: "٢. إدارة الأسرة والعناية المركزة",
        nameEn: "Inpatient Beds & ICU Capacity",
        route: "/hospital/beds-icu",
        purpose: "خريطة تفاعلية حية لجميع أسرة المستشفى والعناية المركزة وتحديث حالتها.",
        inputsAndSearch: ["فلترة حسب القسم أو حالة السرير."],
        actionsAndButtons: ["تغيير حالة السرير بين AVAILABLE / OCCUPIED / CLEANING / MAINTENANCE."],
        apisUsed: ["GET /v1/hospital/beds", "PATCH /v1/hospital/beds/:id/status"],
        dbTables: ["Bed", "AuditLog"],
        realTimeImpact: "تحديث شاشة سعة المنشآت القومية (/analytics/facility-capacity) لحظياً.",
      },
      {
        nameAr: "٣. جدول غرف العمليات الجراحية",
        nameEn: "Surgical Operating Rooms (OR) Schedule",
        route: "/hospital/surgical",
        purpose: "جدولة ومتابعة العمليات الجراحية وربط الجراحين وغرف العمليات والأسرة.",
        inputsAndSearch: ["المريض، الجراح، اسم العملية، رقم غرفة العمليات، نوع التخدير، ووقت البدء والانتهاء."],
        actionsAndButtons: ["زر «جدولة عملية جراحية» وأزرار تحديث حالة العملية (IN_PROGRESS / COMPLETED)."],
        apisUsed: ["GET /v1/hospital/or-cases", "POST /v1/hospital/or-cases", "PATCH /v1/hospital/or-cases/:id"],
        dbTables: ["OrCase", "AuditLog"],
        realTimeImpact: "تنسيق كامل بين الجراحين، التخدير، وبنك الدم.",
      },
      {
        nameAr: "٤. تحويلات الإسعاف والطوارئ الشبكية (123 EMS)",
        nameEn: "EMS Ambulance & Inter-Hospital Transfers",
        route: "/hospital/ems-transfers",
        purpose: "استقبال بلاغات الإسعاف والإحالات الشبكية الواردة للمستشفى وقبولها أو توجيهها.",
        inputsAndSearch: ["فلترة التحويلات حسب درجة الخطورة والحالة."],
        actionsAndButtons: ["زر «قبول التحويل» وزر «إتمام الاستلام»."],
        apisUsed: ["GET /v1/referrals", "PATCH /v1/referrals/:id/status"],
        dbTables: ["Referral", "ErCase", "AuditLog"],
        realTimeImpact: "إغلاق حلقة الإحالة مع الطبيب المرسل وإشعار المواطن.",
      },
      {
        nameAr: "٥. بنك الدم المركزي",
        nameEn: "Central Blood Bank Inventory",
        route: "/hospital/blood-bank",
        purpose: "إدارة أكياس الدم الفردية لكل فصيلة (A+, O-, AB+...) وتواريخ الصلاحية والصرف.",
        inputsAndSearch: ["تسجيل كيس دم جديد (الفصيلة، كود الكيس، المتبرع، تاريخ الصلاحية)."],
        actionsAndButtons: ["زر «إضافة وحدة دم»، زر «حجز (Reserve)»، وزر «صرف لمريض (Use)»."],
        apisUsed: ["GET /v1/hospital/blood-bank", "POST /v1/hospital/blood-bank", "PATCH /v1/hospital/blood-bank/:id"],
        dbTables: ["BloodUnit", "AuditLog"],
        realTimeImpact: "تحديث رصيد فصائل الدم الاستراتيجي في لوحة وزارة الصحة.",
      },
      {
        nameAr: "٦. الامتثال والجودة ومكافحة العدوى (GAHAR)",
        nameEn: "Hospital Compliance & GAHAR Quality",
        route: "/hospital/compliance",
        purpose: "متابعة مؤشرات الاعتماد القومي (GAHAR)، مكافحة العدوى، وكفاءة التشغيل.",
        inputsAndSearch: ["مؤشرات حية مستخرجة من عمليات المستشفى."],
        actionsAndButtons: ["مراجعة وتحديث تقارير الامتثال."],
        apisUsed: ["GET /v1/hospital/compliance"],
        dbTables: ["Bed", "ErCase", "OrCase", "BloodUnit"],
        realTimeImpact: "تقييم أداء المستشفى في غرفة عمليات الوزارة.",
      },
    ],
  },
  {
    id: "reception",
    number: "05",
    titleAr: "موظف الاستقبال والتسجيل المدني الطبي (Reception Desk)",
    titleEn: "Citizen Registration, NFC Card Issuance & Appointments",
    roleEnum: "RECEPTIONIST",
    demoEmail: "reception@mnis.demo",
    demoPassword: "MnisDemo#2026!Secure",
    accentColor: "border-secondary text-secondary",
    badgeBg: "bg-secondary text-on-secondary",
    overview:
      "البوابة التأسيسية التي تبدأ منها رحلة المواطن في المنظومة: فتح الحسابات الوطنية بالرقم القومي المشفر، إصدار وطباعة واستبدال شرائح الطوارئ الذكية (NFC/QR)، وتأكيد حجوزات المواعيد مع الأطباء.",
    keyResponsibilities: [
      "فتح حساب وطني طبي جديد لمواطن أو مولود جديد بالرقم القومي (14 رقماً) مع تشفيره تلقائياً بـ AES-256-GCM.",
      "إصدار كود الهوية الطبية الفريد (MTI) وكلمة مرور مؤقتة لتطبيق الموبايل وشريحة طوارئ NFC في خطوة واحدة.",
      "طباعة بطاقات NFC جديدة، استبدال البطاقات المفقودة/التالفة، أو إيقافها أمنياً (Revoke) مع إشعار المواطن.",
      "مراجعة طلبات حجز المواعيد الواردة من تطبيق المواطن، فحص جدول الطبيب، وتأكيد الموعد لإدراج المريض تلقائياً في طابور العيادة.",
    ],
    endToEndFlowSummary: [
      "١. في (/reception/citizens) يسجل الموظف المواطن الجديد، فيخرج له النظام كود MTI + كلمة المرور المؤقتة + توكن شريحة الطوارئ NFC.",
      "٢. في (/reception/appointments) يراجع الموظف طلب الموعد القادم من تطبيق الموبايل، يختار الطبيب والوقت المتاح، ويضغط «تأكيد».",
      "٣. تلقائياً: ينشئ النظام تذكرة كشف في طابور الطبيب (/doctor/queue) ويرسل إشعاراً فورياً لهاتف المواطن!",
    ],
    screens: [
      {
        nameAr: "١. تسجيل المواطنين وإصدار بطاقات الطوارئ NFC",
        nameEn: "Citizen Onboarding & NFC Card Lifecycle",
        route: "/reception/citizens",
        purpose: "فتح ملفات الهوية الطبية الوطنية للمواطنين وإدارة بطاقات الطوارئ الذكية وكلمات المرور.",
        inputsAndSearch: [
          "بحث بالاسم أو الرقم القومي (14 رقماً) أو كود MTI.",
          "نموذج فتح حساب مواطن: الرقم القومي، الاسم (عربي/إنجليزي)، الجنس، تاريخ الميلاد، فصيلة الدم، المحافظة، التأمين، الحساسيات، والأمراض المزمنة.",
        ],
        actionsAndButtons: [
          "زر «فتح حساب المواطن وإصدار كارت NFC».",
          "أزرار «طباعة كارت NFC»، «استبدال كارت»، «إيقاف أمني (Revoke)»، و«إعادة تعيين كلمة المرور».",
        ],
        apisUsed: [
          "POST /v1/reception/citizens",
          "POST /v1/reception/citizens/:id/reset-password",
          "POST /v1/nfc-cards/print",
          "POST /v1/nfc-cards/replace",
          "PATCH /v1/nfc-cards/:id/revoke",
        ],
        dbTables: ["Patient", "User", "NfcCard", "PushNotification", "AuditLog"],
        realTimeImpact: "يصبح المواطن قادراً فوراً على الدخول لتطبيق الموبايل وتعمل شريحة NFC الخاصة به في شاشة الطوارئ.",
      },
      {
        nameAr: "٢. إدارة وتأكيد طلبات المواعيد",
        nameEn: "Appointment Requests & Slot Confirmation",
        route: "/reception/appointments",
        purpose: "مراجعة حجوزات المواطنين وربطها بالفترات المتاحة في جداول الأطباء.",
        inputsAndSearch: ["اختيار الطبيب + اختيار التاريخ + اختيار الفترة الزمنية المتاحة من جدول الطبيب + ملاحظة للمواطن."],
        actionsAndButtons: ["زر «تأكيد الموعد (Confirm)» وزر «رفض الطلب (Reject)»."],
        apisUsed: [
          "GET /v1/appointments",
          "GET /v1/schedule/doctors/:id/slots",
          "POST /v1/appointments/:id/confirm",
          "POST /v1/appointments/:id/reject",
        ],
        dbTables: ["Appointment", "Visit", "PushNotification", "AuditLog"],
        realTimeImpact: "إدراج آلي للمريض في طابور الطبيب (/doctor/queue) + إشعار فوري لتطبيق المواطن.",
      },
    ],
  },
  {
    id: "executive",
    number: "06",
    titleAr: "القيادة التنفيذية وغرفة عمليات الـ 4 وزارات (Executive Command)",
    titleEn: "Quad-Ministry Sovereign Command & National Analytics",
    roleEnum: "EXECUTIVE",
    demoEmail: "exec@mnis.demo",
    demoPassword: "MnisDemo#2026!Secure",
    accentColor: "border-primary text-primary",
    badgeBg: "bg-primary text-on-primary",
    overview:
      "غرفة القيادة الاستراتيجية التي تحول البيانات الطبية اللحظية لـ 120 مليون مواطن إلى قرارات سيادية في 4 وزارات (الصحة، التعليم العالي، التموين، القوى العاملة)، مع مراقبة التغطية التأمينية، الخرائط الوبائية، الذكاء الدوائي، وكشف الاحتيال.",
    keyResponsibilities: [
      "إدارة غرفة التكامل السيادي للوزارات الأربع (/analytics/ministries) وتشغيل محاكي سقف بطاقات التموين (5 أفراد).",
      "مراقبة الخريطة الوبائية الجغرافية للمحافظات (/analytics/gis-epidemiology) وإنذارات التفشي بمعادلة Z-Score.",
      "متابعة الأداء المالي والتغطية لهيئة التأمين الصحي الشامل (/analytics/uhia-coverage).",
      "مراقبة سعة المستشفيات وأسرة الرعاية المركزة على مستوى الجمهورية (/analytics/facility-capacity).",
      "تشغيل محرك الذكاء الدوائي (/analytics/drug-intelligence) ومحرك كشف الاحتيال التأميني والشذوذ الإحصائي (/analytics/fraud-detection).",
    ],
    endToEndFlowSummary: [
      "١. كل عملية كشف أو تحليل أو صرف دواء أو تسجيل مولود في المستشفيات تصب لحظياً في محرك التحليلات السيادي.",
      "٢. في (/analytics/ministries) تراقب القيادة مؤشرات الـ 4 وزارات وتختبر محاكي وزارة التموين (الذي يحجب الإضافة التموينية تلقائياً بعد الفرد الخامس).",
      "٣. في (/analytics/gis-epidemiology) و(/analytics/fraud-detection) يتم رصد أي بؤرة وبائية أو تلاعب مالي وإصدار تقارير رسمية قابلة للتصدير.",
    ],
    screens: [
      {
        nameAr: "١. غرفة التكامل السيادي للوزارات الأربع",
        nameEn: "Quad-Ministry Sovereign Integration Hub",
        route: "/analytics/ministries",
        purpose: "الربط اللحظي بين وزارات الصحة، التعليم العالي (تنسيق الطب والتمريض)، التموين (سقف الـ 5 أفراد)، والقوى العاملة (التكليف والإجهاد).",
        inputsAndSearch: ["محاكي فحص استحقاق إضافة مولود جديد لبطاقة التموين (كود رب الأسرة، المحافظة، عدد الأفراد الحاليين)."],
        actionsAndButtons: ["زر «فحص استحقاق الإضافة التموينية (Check Subsidy Eligibility)»."],
        apisUsed: ["GET /v1/analytics/quad-ministries", "POST /v1/analytics/quad-ministries/family-check"],
        dbTables: ["Patient", "User", "Bed", "LabSample", "Prescription", "DrugInventory", "AuditLog"],
        realTimeImpact: "إصدار قرارات وزارية فورية مبنية على البيانات الحية.",
      },
      {
        nameAr: "٢. مركز القيادة والمؤشرات العامة",
        nameEn: "National Command Overview",
        route: "/analytics/overview",
        purpose: "لوحة القيادة اللحظية لإجمالي المرضى، إشغال الأسرة، حالات الطوارئ، الروشتات، والعينات المعملية.",
        inputsAndSearch: ["مؤشرات أداء رئيسية (KPIs) حية."],
        actionsAndButtons: ["تحديث البيانات اللحظية."],
        apisUsed: ["GET /v1/analytics/kpis", "GET /v1/analytics/overview"],
        dbTables: ["Patient", "Bed", "ErCase", "Prescription", "LabSample", "Visit"],
        realTimeImpact: "رؤية بانورامية شاملة لحالة المنظومة الصحية في مصر.",
      },
      {
        nameAr: "٣. تغطية التأمين الصحي الشامل (UHIA)",
        nameEn: "UHIA Financial & Population Coverage",
        route: "/analytics/uhia-coverage",
        purpose: "متابعة نسب المواطنين المؤمن عليهم، إجمالي المطالبات المالية، والتسويات الشهرية.",
        inputsAndSearch: ["تحليل مالي وجغرافي للتغطية التأمينية."],
        actionsAndButtons: ["استعراض تفاصيل المطالبات والتسويات."],
        apisUsed: ["GET /v1/analytics/uhia"],
        dbTables: ["Patient", "PharmacyClaim", "PharmacySettlement"],
        realTimeImpact: "حوكمة الموارد المالية لهيئة التأمين الصحي الشامل.",
      },
      {
        nameAr: "٤. سعة المنشآت والأسرة القومية",
        nameEn: "National Facility & ICU Capacity",
        route: "/analytics/facility-capacity",
        purpose: "مراقبة نسب إشغال الأقسام الداخلية والعناية المركزة وغرف العمليات في المستشفيات.",
        inputsAndSearch: ["توزيع الأسرة حسب الحالة والقسم."],
        actionsAndButtons: ["متابعة الاختناقات وتوجيه التحويلات."],
        apisUsed: ["GET /v1/analytics/facility-capacity"],
        dbTables: ["Bed", "ErCase", "OrCase"],
        realTimeImpact: "منع تكدس الطوارئ وتوزيع الحالات بين المستشفيات.",
      },
      {
        nameAr: "٥. الخريطة الوبائية الجغرافية (GIS Epidemiology)",
        nameEn: "GIS Disease Surveillance & Outbreak Map",
        route: "/analytics/gis-epidemiology",
        purpose: "تتبع التوزيع الجغرافي للأمراض المزمنة والمعدية في كل محافظة ورصد البؤر الوبائية.",
        inputsAndSearch: ["فلترة حسب المحافظة أو التصنيف المرضي."],
        actionsAndButtons: ["استعراض تفاصيل كل محافظة ومؤشر الخطر."],
        apisUsed: ["GET /v1/analytics/gis"],
        dbTables: ["Patient", "Prescription", "LabSample"],
        realTimeImpact: "توجيه قوافل وزارة الصحة والأمصال للمحافظات المتأثرة.",
      },
      {
        nameAr: "٦. الذكاء الدوائي وسلاسل الإمداد",
        nameEn: "National Drug Intelligence & Supply Chain",
        route: "/analytics/drug-intelligence",
        purpose: "مراقبة معدلات استهلاك الأدوية، الأصناف التي قاربت على النفاد، وتوقعات الاحتياج الشهري.",
        inputsAndSearch: ["تحليل المخزون الدوائي القومي."],
        actionsAndButtons: ["متابعة نواقص الأدوية الاستراتيجية."],
        apisUsed: ["GET /v1/analytics/drug-intelligence"],
        dbTables: ["DrugInventory", "PrescriptionItem", "ChronicAllowance"],
        realTimeImpact: "منع أزمات نقص الأدوية الحيوية وأدوية الأمراض المزمنة.",
      },
      {
        nameAr: "٧. كشف الاحتيال التأميني والشذوذ الإحصائي",
        nameEn: "AI/Statistical Fraud & Anomaly Detection",
        route: "/analytics/fraud-detection",
        purpose: "رصد أي أنماط غير طبيعية في كتابة الروشتات أو صرف الأدوية أو المطالبات المالية المتكررة.",
        inputsAndSearch: ["فحص تلقائي للروشتات والمطالبات."],
        actionsAndButtons: ["مراجعة الحالات المشتبه بها وإحالتها للتحقيق."],
        apisUsed: ["GET /v1/analytics/fraud"],
        dbTables: ["Prescription", "PharmacyClaim", "AuditLog"],
        realTimeImpact: "حماية المال العام وميزانية التأمين الصحي من التلاعب.",
      },
      {
        nameAr: "٨. التقارير التنفيذية الموحدة",
        nameEn: "Executive Strategic Reports",
        route: "/analytics/reports",
        purpose: "توليد وتصدير تقارير رسمية شاملة عن أداء المنظومة الصحية والوزارات الأربع.",
        inputsAndSearch: ["اختيار نوع التقرير والفترة الزمنية."],
        actionsAndButtons: ["طباعة وتصدير التقارير الرسمية."],
        apisUsed: ["GET /v1/analytics/overview", "GET /v1/analytics/quad-ministries"],
        dbTables: ["All Analytics Models"],
        realTimeImpact: "دعم متخذي القرار في مجلس الوزراء والوزارات الأربع.",
      },
    ],
  },
  {
    id: "admin_rescue",
    number: "07",
    titleAr: "مدير النظام السيادي (SOC Admin) + مسعف الطوارئ (NFC Rescue)",
    titleEn: "System Security Administrator & Zero-Login Paramedic Rescue",
    roleEnum: "ADMIN + PUBLIC_RESCUE",
    demoEmail: "admin@mnis.demo",
    demoPassword: "MnisDemo#2026!Secure",
    accentColor: "border-primary text-primary",
    badgeBg: "bg-primary text-on-primary",
    overview:
      "يجمع هذا المحور بين أعلى سلطة أمنية رقابية في النظام (إدارة الحسابات، مراقبة التشفير AES-256-GCM، وفحص سجل التدقيق غير القابل للتعديل) وبين أسرع أداة لإنقاذ الحياة في الشارع المصري (شاشة طوارئ المسعفين عبر شريحة NFC بدون تسجيل دخول).",
    keyResponsibilities: [
      "إدارة حسابات جميع الكوادر الطبية والقيادات (إنشاء حساب، تفعيل/إيقاف، إعادة تعيين كلمة المرور).",
      "مراقبة لوحة الوضع الأمني السيادي (Security Posture): التحقق من تفعيل تشفير AES-256-GCM والفهرس الأعمى HMAC-SHA256 وتشفير Argon2id.",
      "فحص سجل التدقيق السيادي (Immutable Audit Trail) لكل عملية قراءة أو تعديل تمت في المنظومة.",
      "تمكين المسعف الميداني في موقع الحادث من قراءة شريحة NFC للمصاب فاقد الوعي في أقل من ثانية لعرض فصيلة الدم والحساسيات القاتلة دون كشف الرقم القومي.",
    ],
    endToEndFlowSummary: [
      "١. في (/admin/users) ينشئ مدير النظام حسابات الأطباء والصيادلة ويراقب سجل التدقيق الرقابي.",
      "٢. في (/emergency) يمرر المسعف شريحة NFC الخاصة بالمصاب (مثل NFC-EG-DEMO-001) فيتحقق الخادم من بصمة SHA-256 ويعرض ملف الإنقاذ الفوري.",
    ],
    screens: [
      {
        nameAr: "١. إدارة المستخدمين ومركز العمليات الأمنية (SOC)",
        nameEn: "Staff Governance, Security Posture & Audit Logs",
        route: "/admin/users",
        purpose: "إدارة صلاحيات الكوادر الطبية، مراقبة حالة التشفير السيادي، ومراجعة سجل التدقيق الرقابي.",
        inputsAndSearch: ["نموذج إنشاء موظف جديد (البريد، الدور، الاسم بالعربية والإنجليزية، رقم الترخيص المهني)."],
        actionsAndButtons: [
          "زر «إضافة كادر جديد»، زر «تفعيل/إيقاف الحساب»، زر «إعادة تعيين كلمة المرور»، وتبويب «سجل التدقيق الأمني».",
        ],
        apisUsed: [
          "GET /v1/admin/users",
          "POST /v1/admin/users",
          "PATCH /v1/admin/users/:id/active",
          "GET /v1/admin/users/security-posture",
          "GET /v1/admin/users/audit-logs",
        ],
        dbTables: ["User", "AuditLog"],
        realTimeImpact: "تحكم فوري في صلاحيات الدخول وحوكمة أمن المعلومات القومي.",
      },
      {
        nameAr: "٢. شاشة إنقاذ الطوارئ الفورية بالـ NFC / QR",
        nameEn: "Zero-Login Paramedic NFC / QR Emergency Rescue",
        route: "/emergency",
        purpose: "عرض فصيلة الدم والحساسيات الدوائية القاتلة والأمراض المزمنة للمصاب فاقد الوعي بدون تسجيل دخول.",
        inputsAndSearch: ["قراءة توكن شريحة NFC أو رمز QR أو الكود الطبي MTI + أزرار شرائح تجريبية جاهزة."],
        actionsAndButtons: ["زر «قراءة الشريحة» وزر «اتصال فوري بالإسعاف المصري (123)»."],
        apisUsed: ["POST /v1/nfc-cards/verify"],
        dbTables: ["NfcCard", "Patient", "AuditLog"],
        realTimeImpact: "إنقاذ حياة المصاب في الدقائق الذهبية الأولى ومنع إعطائه دواءً يسبب صدمة تحسسية قاتلة.",
      },
    ],
  },
  {
    id: "citizen_app",
    number: "08",
    titleAr: "المواطن المصري (تطبيق الموبايل الذكي Flutter — 8 شاشات)",
    titleEn: "Egyptian Citizen Mobile Super-App (mnis_app — Flutter)",
    roleEnum: "PATIENT",
    demoEmail: "29304151234567 (أحمد محمد علي) أو 28511201234567 (فاطمة حسن)",
    demoPassword: "MnisDemo#2026!Secure",
    accentColor: "border-tertiary text-tertiary",
    badgeBg: "bg-tertiary text-on-tertiary",
    overview:
      "تطبيق الموبايل الرسمي للمواطن المبني بـ Flutter 3 و Riverpod؛ يضع الهوية الطبية الوطنية (MTI) وكارت الطوارئ والمواعيد والروشتات والتحاليل والأشعة وحالة بطاقة التموين وسجل الرقابة في يد المواطن لحظة بلحظة.",
    keyResponsibilities: [
      "الدخول الآمن بالرقم القومي (14 رقماً) أو عبر أزرار الدخول التجريبي السريع بضغطة واحدة.",
      "استعراض البطاقة الطبية الوطنية (MTI) وفصيلة الدم والحساسيات والأمراض المزمنة.",
      "حجز مواعيد العيادات والمعمل ومتابعة تأكيدها، وطلب تجديد الروشتات المزمنة عن بُعد.",
      "استعراض نتائج التحاليل الرقمية المعتمدة وتقارير الأشعة التشخيصية (PACS).",
      "متابعة حالة الأسرة التموينية (حد الـ 5 أفراد) وحصص الأدوية المزمنة الشهرية وسجل الرقابة السيادي (من شاهد ملفي).",
      "توليد كود مشاركة مؤقت (10 أحرف لمدة 10 دقائق) لإعطائه للطبيب لفك قفل السجل الطبي الكامل.",
    ],
    endToEndFlowSummary: [
      "١. يفتح المواطن التطبيق ويسجل دخوله بالرقم القومي (أو زر الدخول التجريبي)، فيحصل على التوكن ويستدعي التطبيق بياناته الموحدة.",
      "٢. كل إجراء يتم في البوابة (تأكيد موعد، توقيع روشتة، صرف دواء، اعتماد نتيجة تحليل، رفع أشعة) يظهر فوراً في شاشات التطبيق مع إشعار فوري!",
      "٣. في شاشة الملف الطبي الشامل، يشاهد المواطن الملخص السيادي (Summary Hub) الذي يربطه بوزارة التموين والصيدلية والمعمل وسجل الأمن.",
    ],
    screens: [
      {
        nameAr: "١. شاشة الدخول الذكي (LoginScreen)",
        nameEn: "lib/features/auth/presentation/screens/login_screen.dart",
        route: "/reception/citizens",
        purpose: "تسجيل دخول المواطن بالرقم القومي وكلمة المرور مع أزرار دخول تجريبي بضغطة واحدة.",
        inputsAndSearch: ["الرقم القومي (14 رقماً) + كلمة المرور + أزرار دخول سريع (أحمد محمد علي / فاطمة حسن)."],
        actionsAndButtons: ["زر «تسجيل الدخول» وأزرار الدخول التجريبي الفوري."],
        apisUsed: ["POST /v1/auth/citizen/login"],
        dbTables: ["User", "Patient", "RefreshToken", "AuditLog"],
        realTimeImpact: "توثيق جلسة المواطن وتحميل ملفه الطبي المشفر.",
      },
      {
        nameAr: "٢. الشاشة الرئيسية والبطاقة الطبية (HomeScreen)",
        nameEn: "lib/features/home/presentation/screens/home_screen.dart",
        route: "/reception/citizens",
        purpose: "عرض بطاقة الهوية الطبية الوطنية (MTI)، فصيلة الدم، حالة التأمين، الحساسيات، والأمراض المزمنة.",
        inputsAndSearch: ["عرض تفاعلي ثنائي اللغة."],
        actionsAndButtons: ["الوصول السريع لكارت الطوارئ والمواعيد والروشتات والتحاليل."],
        apisUsed: ["GET /v1/me/profile", "GET /v1/me/card"],
        dbTables: ["Patient", "NfcCard"],
        realTimeImpact: "هوية طبية رقمية معتمدة تغني عن البطاقات الورقية.",
      },
      {
        nameAr: "٣. حجز وإدارة المواعيد (AppointmentsScreen)",
        nameEn: "lib/features/appointments/presentation/screens/appointments_screen.dart",
        route: "/reception/appointments",
        purpose: "طلب حجز موعد جديد في العيادة أو المعمل ومتابعة حالة التأكيد أو إلغائه.",
        inputsAndSearch: ["نوع الموعد (CLINIC / LAB)، التاريخ المفضل، وسبب الزيارة."],
        actionsAndButtons: ["زر «حجز موعد جديد» وزر «إلغاء الموعد»."],
        apisUsed: ["GET /v1/me/appointments", "POST /v1/me/appointments", "DELETE /v1/me/appointments/:id"],
        dbTables: ["Appointment", "AuditLog"],
        realTimeImpact: "يظهر الطلب فوراً لدى موظف الاستقبال لتأكيده.",
      },
      {
        nameAr: "٤. الروشتات وتجديد العلاج المزمن (PrescriptionsScreen)",
        nameEn: "lib/features/prescriptions/presentation/screens/prescriptions_screen.dart",
        route: "/doctor/e-prescriptions",
        purpose: "عرض الروشتات النشطة والمصروفة وتفاصيل الجرعات وطلب تجديد الروشتة المزمنة عن بُعد.",
        inputsAndSearch: ["استعراض الأدوية والجرعات وحالة الصرف."],
        actionsAndButtons: ["زر «طلب تجديد الروشتة (Request Renewal)»."],
        apisUsed: ["GET /v1/me/prescriptions", "POST /v1/me/renewals"],
        dbTables: ["Prescription", "RenewalRequest", "AuditLog"],
        realTimeImpact: "يصل طلب التجديد فوراً إلى شاشة الطبيب (/doctor/renewals).",
      },
      {
        nameAr: "٥. نتائج التحاليل المعملية (LabsScreen)",
        nameEn: "lib/features/labs/presentation/screens/labs_screen.dart",
        route: "/doctor/lab-orders",
        purpose: "عرض نتائج التحاليل المعتمدة بالأرقام والمدى المرجعي وتنبيهات القيم غير الطبيعية.",
        inputsAndSearch: ["استعراض العينات والمؤشرات الرقمية."],
        actionsAndButtons: ["فتح تفاصيل التحليل والمؤشرات."],
        apisUsed: ["GET /v1/me/labs"],
        dbTables: ["LabSample", "LabResult"],
        realTimeImpact: "اطلاع فوري للمواطن بمجرد اعتماد النتيجة في المعمل.",
      },
      {
        nameAr: "٦. السجل الطبي والملخص السيادي الشامل (MedicalFileScreen)",
        nameEn: "lib/features/medical_file/presentation/screens/medical_file_screen.dart",
        route: "/analytics/ministries",
        purpose: "عرض حالة التموين (حد الـ 5 أفراد)، الحصص المزمنة، الإحالات، الأشعة PACS، سجل الرقابة، ورفع الوثائق.",
        inputsAndSearch: ["رفع وثيقة طبية جديدة (عنوان + ملف Base64)."],
        actionsAndButtons: ["تحديث الملخص السيادي، رفع وثيقة، وحذف وثيقة."],
        apisUsed: ["GET /v1/me/summary-hub", "GET /v1/me/documents", "POST /v1/me/documents"],
        dbTables: ["ChronicAllowance", "Referral", "RadiologyUpload", "AuditLog", "Document"],
        realTimeImpact: "شفافية مطلقة تربط المواطن بالوزارات الأربع وسجل الرقابة الأمني.",
      },
      {
        nameAr: "٧. كارت الطوارئ وكود المشاركة المؤقت (EmergencyQrScreen)",
        nameEn: "lib/features/emergency_qr/presentation/screens/emergency_qr_screen.dart",
        route: "/doctor/shared-record",
        purpose: "عرض QR الطوارئ للمسعفين وتوليد كود مشاركة سري مؤقت (10 دقائق) للطبيب.",
        inputsAndSearch: ["توليد كود مشاركة من 10 أحرف."],
        actionsAndButtons: ["زر «توليد كود مشاركة للطبيب» وزر «إيقاف الكود»."],
        apisUsed: ["GET /v1/me/card", "POST /v1/me/shares", "DELETE /v1/me/shares/:code"],
        dbTables: ["ShareToken", "NfcCard", "AuditLog"],
        realTimeImpact: "يفك الطبيب قفل السجل في (/doctor/shared-record) باستخدام هذا الكود.",
      },
      {
        nameAr: "٨. مركز الإشعارات اللحظية (NotificationsScreen)",
        nameEn: "lib/features/notifications/presentation/screens/notifications_screen.dart",
        route: "/reception/appointments",
        purpose: "استقبال كافة التنبيهات الفورية (تأكيد موعد، جاهزية تحليل، صرف دواء، قرار تجديد).",
        inputsAndSearch: ["قائمة الإشعارات مرتبة زمنياً."],
        actionsAndButtons: ["تحديد الإشعار كمقروء."],
        apisUsed: ["GET /v1/notifications", "PATCH /v1/notifications/:id/read"],
        dbTables: ["PushNotification"],
        realTimeImpact: "تواصل لحظي مستمر بين المنظومة والمواطن.",
      },
    ],
  },
];

const CHAPTERS = [
  { id: "ch-hero", num: "01", label: "الرؤية القومية والمعمارية (120M)" },
  { id: "ch-roles", num: "02", label: "موسوعة الفلو التفصيلي لكل مستخدم وجهة" },
  { id: "ch-ministries", num: "03", label: "الترابط السيادي للـ 4 وزارات + المحاكي" },
  { id: "ch-Lifecycle", num: "04", label: "دورات الترابط اللحظي الـ 6 (End-to-End)" },
  { id: "ch-security", num: "05", label: "هندسة التشفير والأمن السيادي" },
  { id: "ch-database", num: "06", label: "قاعدة البيانات (27 جدول) والـ APIs" },
  { id: "ch-demo", num: "07", label: "خطة المناقشة والحسابات التجريبية" },
];

export default function MasterPresentationPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("doctor");
  const [screenSearch, setScreenSearch] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [rationFamilyCount, setRationFamilyCount] = useState<number>(5);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const activeRole = useMemo(
    () => ROLES_ENCYCLOPEDIA.find((r) => r.id === selectedRoleId) ?? ROLES_ENCYCLOPEDIA[0]!,
    [selectedRoleId]
  );

  const filteredScreens = useMemo(() => {
    const q = screenSearch.trim().toLowerCase();
    if (!q) return activeRole.screens;
    return activeRole.screens.filter(
      (s) =>
        s.nameAr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.route.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        s.apisUsed.some((a) => a.toLowerCase().includes(q))
    );
  }, [activeRole, screenSearch]);

  function copyText(text: string) {
    navigator.clipboard?.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 1800);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-on-surface">
      {/* =====================================================================
          TOP GLASSMORPHIC NAVIGATION BAR (Responsive on all devices)
      ===================================================================== */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/40 bg-surface-container-lowest/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface lg:hidden"
              aria-label="فهرس العرض"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Image
              src={BRAND_LOGO_URL}
              alt="MNIS"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
              unoptimized
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm sm:text-base font-black text-primary">
                  منظومة الهوية الطبية الوطنية الموحدة (MNIS)
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-tertiary-container px-2.5 py-0.5 text-[11px] font-bold text-on-tertiary-container">
                  <Sparkles className="h-3 w-3" />
                  120M Citizens Scale
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant hidden sm:block">
                الوثيقة المعمارية والعرض التفاعلي الشامل — كل مستخدم، كل شاشة، كل وزارة، وكل مسار عمل بالتفصيل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/analytics/ministries"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container-high transition-colors"
            >
              <Building2 className="h-4 w-4 text-secondary" />
              غرفة الـ 4 وزارات
            </Link>
            <Link
              href="/emergency"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-error-container px-3 py-2 text-xs font-bold text-on-error-container hover:opacity-90 transition-opacity"
            >
              <Siren className="h-4 w-4" />
              طوارئ NFC
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-level-1 hover:opacity-95 transition-opacity"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>دخول المنظومة</span>
            </Link>
          </div>
        </div>

        {/* Mobile Chapter Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-outline-variant/40 bg-surface-container-lowest p-4 lg:hidden">
            <p className="mb-2 text-xs font-bold text-on-surface-variant">فهرس فصول العرض التقديمي:</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {CHAPTERS.map((ch) => (
                <a
                  key={ch.id}
                  href={`#${ch.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface hover:bg-primary-container hover:text-on-primary-container"
                >
                  <span className="font-mono text-[11px] font-black text-secondary">{ch.num}</span>
                  <span>{ch.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          MAIN LAYOUT: STICKY CHAPTER INDEX (DESKTOP) + RICH CONTENT STREAM
      ===================================================================== */}
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:py-8">
        {/* Sticky Right Table of Contents (Desktop) */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-level-1">
            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs font-black text-primary">فهرس الموسوعة التفاعلية</span>
            </div>
            <nav className="flex flex-col gap-1">
              {CHAPTERS.map((ch) => (
                <a
                  key={ch.id}
                  href={`#${ch.id}`}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-container text-[11px] font-mono font-black text-secondary group-hover:bg-primary group-hover:text-on-primary">
                    {ch.num}
                  </span>
                  <span className="leading-snug">{ch.label}</span>
                </a>
              ))}
            </nav>

            <div className="rounded-xl bg-surface-container-low p-3 space-y-2 border border-outline-variant/30">
              <p className="text-[11px] font-bold text-primary">الانتقال السريع لأدوار المستخدمين:</p>
              <div className="flex flex-wrap gap-1">
                {ROLES_ENCYCLOPEDIA.map((r) => (
                  <a
                    key={r.id}
                    href="#ch-roles"
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors ${
                      selectedRoleId === r.id
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {r.titleAr.split("(")[0]}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Stream */}
        <main className="min-w-0 flex-1 space-y-12 pb-20">
          {/* =================================================================
              CHAPTER 1: EXECUTIVE HERO & ARCHITECTURAL VISION (120M CITIZENS)
          ================================================================= */}
          <section id="ch-hero" className="scroll-mt-24 space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-10 shadow-level-2">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3.5 py-1 text-xs font-bold text-on-primary-container">
                    <Presentation className="h-3.5 w-3.5" />
                    العرض الأكاديمي والهندسي الشامل لمشروع التخرج
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-container px-3 py-1 text-xs font-bold text-on-tertiary-container">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    بنية تحتية سيادية لـ 120 مليون مواطن
                  </span>
                </div>

                <div className="space-y-3 max-w-4xl">
                  <h1 className="text-2xl sm:text-4xl font-black leading-tight text-primary">
                    منظومة الهوية الطبية الوطنية الموحدة (MNIS)
                    <span className="block text-lg sm:text-2xl font-bold text-secondary mt-1">
                      الشبكة السيادية لربط المستشفيات والمعامل والصيدليات وتطبيق المواطن بـ 4 وزارات استراتيجية في الوقت الفعلي
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base leading-relaxed text-on-surface-variant">
                    مشروع قومي متكامل يقضي جذرياً على تشتت التاريخ المرضي للمواطن المصري، ويمنح كل مواطن منذ لحظة الميلاد <strong>كود هوية طبية وطنية موحد (`MTI-EG-...`)</strong> مرتبطاً برقمه القومي المشفر (`AES-256-GCM`)، بحيث تتزامن فيه <strong>بوابة الكوادر الطبية (`32` شاشة ويب)</strong> مع <strong>الخادم المركزي (`85+` نقطة اتصال)</strong> مع <strong>تطبيق المواطن الذكي (`Flutter` — `8` شاشات)</strong> مع <strong>شرائح إنقاذ الحوادث (`NFC / QR`)</strong> ومع <strong>غرفة اتخاذ القرار لـ 4 وزارات سيادية</strong>.
                  </p>
                </div>

                {/* Key Numbers Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8 pt-2">
                  {[
                    { value: "120M", label: "سعة تصميمية للمواطنين" },
                    { value: "4 وزارات", label: "ترابط حكومي لحظي" },
                    { value: "9 جهات", label: "أدوار ومسارات عمل" },
                    { value: "40 شاشة", label: "32 ويب + 8 موبايل" },
                    { value: "27 جدول", label: "قاعدة بيانات PostgreSQL" },
                    { value: "85+ API", label: "نقطة اتصال REST مؤمنة" },
                    { value: "AES-256", label: "تشفير الرقم القومي" },
                    { value: "< 1ms", label: "بحث بالفهرس الأعمى" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/70 p-3.5 text-center"
                    >
                      <div className="font-mono text-lg sm:text-xl font-black text-primary">{stat.value}</div>
                      <div className="mt-1 text-[11px] font-bold text-on-surface-variant">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Architecture Flow across the 3 Platforms */}
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8 shadow-level-1 space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-primary flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-secondary" />
                  الهيكل المعماري الثلاثي والتقنيات المستخدمة (Tech Stack for 120M Citizens)
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  كيف تتكامل المنصات الثلاث (`mnis-portal` + `mnis-api` + `mnis_app`) مع قاعدة البيانات المشفرة والوزارات الأربع
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border-2 border-primary/20 bg-surface-container-low/50 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-on-primary">
                      الطبقة الأولى: الواجهات (Clients)
                    </span>
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-black text-on-surface">
                    بوابة الويب (`Next.js 16`) + تطبيق المواطن (`Flutter 3`) + شريحة `NFC`
                  </h3>
                  <ul className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                    <li>• <strong>`mnis-portal`:</strong> مبنية بـ `Next.js 16 App Router` و `React 19` و `TypeScript` و `Tailwind CSS`؛ تضم 7 بوابات (32 شاشة) ثنائية اللغة (`RTL/LTR`) مع شريط بحث علوي لحظي (`Live Command Palette`).</li>
                    <li>• <strong>`mnis_app`:</strong> مبني بـ `Flutter 3` و `Riverpod` و `Dio`؛ يعمل بسرعة `Native` على `Android/iOS` ويضم 8 شاشات للمواطن.</li>
                    <li>• <strong>`NFC/QR Rescue`:</strong> واجهة طوارئ فورية للمسعفين (`/emergency`) تعمل بدون تسجيل دخول.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border-2 border-secondary/25 bg-surface-container-low/50 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-on-secondary">
                      الطبقة الثانية: الخادم المركزي (`mnis-api`)
                    </span>
                    <Network className="h-5 w-5 text-secondary" />
                  </div>
                  <h3 className="text-base font-black text-on-surface">
                    `NestJS 11` Modular Enterprise API + المحركات السيادية
                  </h3>
                  <ul className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                    <li>• <strong>معمارية معيارية (`13 Modules`):</strong> تفصل كل قطاع في Module مستقل قابل للتحويل الفوري إلى `Microservices`.</li>
                    <li>• <strong>محرك التشفير (`CryptoService`):</strong> يشفر الرقم القومي بـ `AES-256-GCM` ويولد بصمة `HMAC-SHA256` للبحث في $O(1)$.</li>
                    <li>• <strong>المعترض الرقابي (`AuditInterceptor`):</strong> يسجل كل عملية في `AuditLog` ويفك تشفير الرقم القومي في الذاكرة فقط للكوادر المخولة.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border-2 border-tertiary/25 bg-surface-container-low/50 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-tertiary px-2.5 py-1 text-xs font-bold text-on-tertiary">
                      الطبقة الثالثة: البيانات (`Persistence`)
                    </span>
                    <Database className="h-5 w-5 text-tertiary" />
                  </div>
                  <h3 className="text-base font-black text-on-surface">
                    `PostgreSQL` + `Prisma ORM 6` (`27` جدول علائقي)
                  </h3>
                  <ul className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                    <li>• <strong>معاملات ذرية صارمة (`ACID Transactions`):</strong> تمنع تضارب مناداة المرضى أو صرف الأدوية أو تسكين الأسرة.</li>
                    <li>• <strong>فهرسة مركبة (`Composite B-Tree Indexes`):</strong> على الكود الطبي `mti`، البصمة العمياء `nationalIdIdx`، والمحافظة `governorate`.</li>
                    <li>• <strong>قابلية التقسيم الأفقي (`Horizontal Partitioning`):</strong> جاهزة للتوزيع الجغرافي على الـ 27 محافظة لخدمة 120 مليون مواطن.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================================
              CHAPTER 2: EXHAUSTIVE ROLE-BY-ROLE & SCREEN-BY-SCREEN FLOWS
          ================================================================= */}
          <section id="ch-roles" className="scroll-mt-24 space-y-6">
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8 shadow-level-2 space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-secondary">
                  الفصل الثاني • تفصيل كامل لكل مستخدم وكل جهة وكل شاشة
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-primary">
                  موسوعة الفلو التفصيلي لكل مستخدم وكل جهة في المنظومة (40 شاشة مشروحة بالكامل)
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  اختر أي مستخدم أو جهة من البطاقات التالية لتستعرض: <strong>جميع مهام ومسؤوليات هذا الدور</strong>، <strong>مسار العمل المترابط من البداية للنهاية</strong>، و<strong>تفصيل كل شاشة من شاشاته (المدخلات، البحث، الأزرار، الـ APIs، جداول قاعدة البيانات، والأثر الفوري على باقي المنظومة)</strong>.
                </p>
              </div>

              {/* Role Selector Grid (Responsive 1 -> 2 -> 4 columns) */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {ROLES_ENCYCLOPEDIA.map((role) => {
                  const isActive = role.id === selectedRoleId;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        setScreenSearch("");
                      }}
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-start transition-all ${
                        isActive
                          ? "border-2 border-primary bg-primary-container text-on-primary-container shadow-level-2"
                          : "border-outline-variant/50 bg-surface-container-low/60 text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-lg px-2 py-0.5 font-mono text-xs font-black ${
                            isActive ? "bg-on-primary-container text-primary-container" : "bg-primary/10 text-primary"
                          }`}
                        >
                          {role.number}
                        </span>
                        <span className="font-mono text-[11px] font-bold opacity-80">
                          {role.screens.length} شاشات
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xs sm:text-sm font-black leading-snug">{role.titleAr}</div>
                        <div className="mt-1 font-mono text-[10px] opacity-75">{role.roleEnum}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Role Header Card */}
              <div className="rounded-2xl border-2 border-primary/20 bg-surface-container-low p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/40 pb-4">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-0.5 font-mono text-xs font-bold ${activeRole.badgeBg}`}>
                        Role: {activeRole.roleEnum}
                      </span>
                      <span className="text-xs font-semibold text-on-surface-variant">{activeRole.titleEn}</span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-primary">{activeRole.titleAr}</h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-on-surface">{activeRole.overview}</p>
                  </div>

                  {/* Credentials Quick Box */}
                  <div className="w-full sm:w-auto rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3.5 text-xs space-y-1.5 shadow-level-1">
                    <div className="font-bold text-primary flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-secondary" />
                      حساب الدخول التجريبي الجاهز:
                    </div>
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px]" dir="ltr">
                      <span className="text-on-surface font-bold">{activeRole.demoEmail}</span>
                      <button
                        type="button"
                        onClick={() => copyText(activeRole.demoEmail)}
                        className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] hover:bg-primary hover:text-on-primary"
                        title="نسخ"
                      >
                        {copiedEmail === activeRole.demoEmail ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-tertiary font-bold" dir="ltr">
                      Pass: {activeRole.demoPassword}
                    </div>
                  </div>
                </div>

                {/* Role Capabilities & End-to-End Flow */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 sm:p-5 space-y-3">
                    <h4 className="text-sm sm:text-base font-black text-primary flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-tertiary" />
                      جميع الصلاحيات والمهام التي يقدر يعملها هذا المستخدم:
                    </h4>
                    <ul className="space-y-2">
                      {activeRole.keyResponsibilities.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-on-surface">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-[10px] font-black text-on-tertiary-container">
                            {i + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 sm:p-5 space-y-3">
                    <h4 className="text-sm sm:text-base font-black text-secondary flex items-center gap-2">
                      <Activity className="h-4 w-4 text-secondary" />
                      ملخص الفلو المترابط لهذا الدور عبر المنظومة:
                    </h4>
                    <div className="space-y-2.5">
                      {activeRole.endToEndFlowSummary.map((step, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-3 text-xs leading-relaxed text-on-surface"
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Screen-by-Screen Detailed Breakdown */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-base sm:text-lg font-black text-primary">
                      تفصيل جميع شاشات هذا المستخدم شاشة بشاشة ({activeRole.screens.length} شاشات):
                    </h4>
                    <div className="relative w-full sm:w-72">
                      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        value={screenSearch}
                        onChange={(e) => setScreenSearch(e.target.value)}
                        placeholder="ابحث داخل شاشات أو APIs هذا الدور..."
                        className="h-9 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest ps-9 pe-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {filteredScreens.map((scr, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-level-1 transition-all hover:border-primary/50"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-sm sm:text-base font-black text-primary">{scr.nameAr}</h5>
                              <span className="rounded-md bg-surface-container px-2 py-0.5 font-mono text-[11px] font-bold text-secondary">
                                {scr.nameEn}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-on-surface-variant">{scr.purpose}</p>
                          </div>
                          <Link
                            href={scr.route}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-on-primary shadow-level-1 hover:opacity-90"
                          >
                            <span>افتح الشاشة الحية</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl bg-surface-container-low/70 p-3.5 space-y-1.5">
                            <div className="text-[11px] font-black text-primary">
                              ١. المدخلات وأدوات البحث في الشاشة:
                            </div>
                            <ul className="space-y-1 text-xs text-on-surface">
                              {scr.inputsAndSearch.map((inp, i) => (
                                <li key={i}>• {inp}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl bg-surface-container-low/70 p-3.5 space-y-1.5">
                            <div className="text-[11px] font-black text-secondary">
                              ٢. الأزرار والإجراءات المتاحة:
                            </div>
                            <ul className="space-y-1 text-xs text-on-surface">
                              {scr.actionsAndButtons.map((act, i) => (
                                <li key={i}>• {act}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl bg-surface-container-low/70 p-3.5 space-y-2">
                            <div className="text-[11px] font-black text-on-surface">
                              ٣. نقاط الاتصال (APIs) وجداول قاعدة البيانات:
                            </div>
                            <div className="space-y-1" dir="ltr">
                              {scr.apisUsed.map((apiStr, i) => (
                                <div
                                  key={i}
                                  className="rounded bg-surface-container-lowest px-2 py-0.5 font-mono text-[10px] font-bold text-primary border border-outline-variant/40"
                                >
                                  {apiStr}
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1" dir="ltr">
                              {scr.dbTables.map((tbl) => (
                                <span
                                  key={tbl}
                                  className="rounded bg-secondary-container px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-secondary-container"
                                >
                                  Prisma.{tbl}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-tertiary/30 bg-tertiary-container/30 p-3.5 space-y-1.5">
                            <div className="text-[11px] font-black text-tertiary">
                              ٤. الترابط والأثر اللحظي في باقي المنظومة:
                            </div>
                            <p className="text-xs leading-relaxed text-on-surface font-medium">
                              {scr.realTimeImpact}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================================
              CHAPTER 3: THE 4 SOVEREIGN MINISTRIES & LIVE RATION SIMULATOR
          ================================================================= */}
          <section id="ch-ministries" className="scroll-mt-24 space-y-6">
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8 shadow-level-2 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-secondary">
                    الفصل الثالث • الحوكمة السيادية والترابط الوزاري الرباعي
                  </span>
                  <h2 className="mt-1 text-xl sm:text-3xl font-black text-primary">
                    كيف تتصل الـ 4 وزارات استراتيجية بمنظومة الهوية الطبية الوطنية لحظياً؟
                  </h2>
                </div>
                <Link
                  href="/analytics/ministries"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-level-1"
                >
                  <Building2 className="h-4 w-4" />
                  افتح غرفة الـ 4 وزارات الحية (/analytics/ministries)
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Ministry 1 */}
                <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low/50 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                      <HeartPulse className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-primary">
                        ١. وزارة الصحة والسكان (MoHP)
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        الرصد الوبائي المبكر، الأمصال وسلسلة التبريد، وبنوك الدم الاستراتيجية
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-3 font-mono text-xs font-bold text-secondary border border-outline-variant/40" dir="ltr">
                    Z_Score = (Current_Cases − Baseline_Mean) / Baseline_StdDev   →   Outbreak if Z &gt; 2.5
                  </div>
                  <ul className="space-y-1.5 text-xs text-on-surface leading-relaxed">
                    <li>• <strong>المدخلات اللحظية:</strong> كل تشخيص `ICD-10` من العيادات + كل عينة معملية حرجة + أرصدة الأمصال وأكياس الدم في المستشفيات.</li>
                    <li>• <strong>القرار الاستراتيجي الآلي:</strong> إطلاق إنذار تفشٍّ وبائي فوري (`CRITICAL_OUTBREAK`) في المحافظة التي يتجاوز فيها `Z-Score` حاجز `2.5`، وتوجيه قوافل الأمصال وأكياس الدم آلياً قبل انتشار العدوى.</li>
                  </ul>
                </div>

                {/* Ministry 2 */}
                <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low/50 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-on-secondary">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-primary">
                        ٢. وزارة التعليم العالي والبحث العلمي (MoHESR)
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        التحكم الديناميكي في تنسيق كليات الطب البشري والتمريض حسب العجز الفعلي
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-3 font-mono text-xs font-bold text-secondary border border-outline-variant/40" dir="ltr">
                    Staff_Density = (Active_Doctors_or_Nurses / Governorate_Pop) × 1,000 vs WHO_Target
                  </div>
                  <ul className="space-y-1.5 text-xs text-on-surface leading-relaxed">
                    <li>• <strong>المدخلات اللحظية:</strong> أعداد الأطباء وأطقم التمريض المرخصين والعاملين فعلياً في كل محافظة مقارنة بالتعداد السكاني وحجم ضغط المستشفيات.</li>
                    <li>• <strong>القرار الاستراتيجي الآلي:</strong> في المحافظات التي تعاني من عجز في الأطباء أو التمريض، يُصدر النظام توصية لمكتب التنسيق <strong>بخفض الحد الأدنى للقبول بكليات الطب أو التمريض الإقليمية</strong> (مثلاً `-1.5%` إلى `-2.8%`) مع شرط التكليف الإقليمي؛ وفي المحافظات المشبعة يوصي <strong>برفع التنسيق</strong>.</li>
                  </ul>
                </div>

                {/* Ministry 3 */}
                <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low/50 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tertiary text-on-tertiary">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-primary">
                        ٣. وزارة التموين والتجارة الداخلية (MoSIT)
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        تطبيق سقف الـ 5 أفراد للأسرة على بطاقة التموين وتوجيه الدعم الغذائي العلاجي
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-3 font-mono text-xs font-bold text-tertiary border border-outline-variant/40" dir="ltr">
                    If (Current_Family_Members ≥ 5)  ⇒  Decision = BLOCK_RATION_ADDITION_EXCEEDS_5_CAP
                  </div>
                  <ul className="space-y-1.5 text-xs text-on-surface leading-relaxed">
                    <li>• <strong>القاعدة السيادية (سقف الـ 5 أفراد):</strong> بمجرد وصول عدد أفراد الأسرة إلى **5 أفراد**، يقوم النظام تلقائياً بقفل وإيقاف إضافة المولود السادس (أو أي فرد إضافي) على بطاقة التموين، بحيث لا يستطيع رب الأسرة إضافته للتموين، بينما يستمر المولود في التمتع الكامل بالرعاية الصحية والتطعيمات المجانية.</li>
                    <li>• <strong>الأمن الغذائي الذكي:</strong> ربط نسب أنيميا الأطفال في تحاليل المعامل بتوجيه سلع تموينية مدعمة بالحديد والفيتامينات للمحافظات الأعلى إصابة.</li>
                  </ul>
                </div>

                {/* Ministry 4 */}
                <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low/50 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-primary">
                        ٤. وزارة القوى العاملة / العمل (MoL)
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        توزيع التكليف الطبي القومي ومراقبة مؤشر الإجهاد الوظيفي للأطقم الطبية
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-3 font-mono text-xs font-bold text-primary border border-outline-variant/40" dir="ltr">
                    Burnout_Score = f(Clinic_Queue_Load, ER_Critical_Cases, Shift_Hours) ∈ [0, 100]
                  </div>
                  <ul className="space-y-1.5 text-xs text-on-surface leading-relaxed">
                    <li>• <strong>المدخلات اللحظية:</strong> ضغط الكشوفات اليومي وحالات الطوارئ والعمليات لكل طبيب وممرض، ونسب العجز في كل مستشفى.</li>
                    <li>• <strong>القرار الاستراتيجي الآلي:</strong> توجيه حركة التكليف والانتداب الطبي لسد العجز، وإطلاق إنذار (`HIGH_RISK_FATIGUE`) عند ارتفاع مؤشر الإجهاد في أي مستشفى لحماية الأطقم الطبية ومنع الأخطاء.</li>
                  </ul>
                </div>
              </div>

              {/* Interactive Ministry of Supply 5-Member Cap Simulator right inside the page */}
              <div className="rounded-2xl border-2 border-primary/25 bg-surface-container-low p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-primary">
                      محاكي تفاعلي حي: محرك وزارة التموين وقاعدة الحد الأقصى (5 أفراد للأسرة)
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      جرّب تغيير عدد أفراد الأسرة الحاليين لترى القرار السيادي اللحظي الذي يصدره المحرك (`POST /v1/analytics/quad-ministries/family-check`):
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRationFamilyCount(num)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-black transition-all ${
                          rationFamilyCount === num
                            ? "bg-primary text-on-primary shadow-level-1"
                            : "bg-surface-container-lowest text-on-surface border border-outline-variant/50"
                        }`}
                      >
                        {num} أفراد حالياً
                      </button>
                    ))}
                  </div>
                </div>

                {rationFamilyCount >= 5 ? (
                  <div className="rounded-xl border border-error/40 bg-error-container/50 p-4 text-xs sm:text-sm font-bold text-on-error-container">
                    🚨 القرار السيادي الآلي (`BLOCK_RATION_ADDITION_EXCEEDS_5_CAP`): الأسرة وصلت إلى الحد الأقصى المقرر تموينياً ({rationFamilyCount} أفراد / السقف 5 أفراد). تم إيقاف وحجب إمكانية إضافة أي فرد جديد على بطاقة التموين لدى وزارة التموين تلقائياً، مع استمرار تمتع المولود بكامل التغطية الصحية والتطعيمات المجانية في منظومة الهوية الطبية الوطنية (`MNIS`).
                  </div>
                ) : (
                  <div className="rounded-xl border border-tertiary/40 bg-tertiary-container/50 p-4 text-xs sm:text-sm font-bold text-on-tertiary-container">
                    ✅ القرار السيادي الآلي (`ALLOW_RATION_ADDITION`): عدد أفراد الأسرة الحالي ({rationFamilyCount} أفراد) أقل من سقف الـ 5 أفراد. يُسمح لرب الأسرة بإضافة المولود الجديد على بطاقة التموين (المتبقي بعد هذه الإضافة: {5 - rationFamilyCount - 1} أفراد).
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =================================================================
              CHAPTER 4: 6 END-TO-END REAL-TIME INTERCONNECTIVITY FLOWS
          ================================================================= */}
          <section id="ch-Lifecycle" className="scroll-mt-24 space-y-6">
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8 shadow-level-2 space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-secondary">
                  الفصل الرابع • مسارات الترابط اللحظي عبر المنصات الثلاث
                </span>
                <h2 className="mt-1 text-xl sm:text-3xl font-black text-primary">
                  ٦ دورات ترابط كاملة بين البوابة (`Portal`) والخادم (`API`) وتطبيق المواطن (`Flutter`)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  {
                    title: "١. دورة فتح الحساب وإصدار شريحة الطوارئ NFC",
                    steps: [
                      "موظف الاستقبال يسجل المواطن بالرقم القومي في (/reception/citizens).",
                      "يشفر الخادم الرقم القومي بـ AES-256-GCM ويولد كود MTI-EG-... وحساب الموبايل وشريحة NFC نشطة.",
                      "يدخل المواطن فوراً لتطبيق الموبايل (Flutter)، وتعمل شريحته في (/emergency) لإنقاذ حياته عند الحوادث.",
                    ],
                  },
                  {
                    title: "٢. دورة حجز الموعد من الموبايل حتى دخول غرفة كشف الطبيب",
                    steps: [
                      "المواطن يطلب موعداً من تطبيق Flutter (POST /v1/me/appointments).",
                      "يراجع موظف الاستقبال الطلب في (/reception/appointments)، يختار الطبيب والوقت المتاح من جدوله، ويؤكد الموعد.",
                      "تلقائياً: ينشئ النظام تذكرة انتظار (Visit A-XX) في طابور الطبيب (/doctor/queue) + يرسل إشعاراً فورياً لهاتف المواطن!",
                    ],
                  },
                  {
                    title: "٣. دورة الروشتة الإلكترونية المزمنة والصرف والتأمين الصحي",
                    steps: [
                      "الطبيب في (/doctor/consultation) يضيف الأدوية، فيفحص النظام الحساسية والتداخلات الدوائية (DDI) ثم يوقع الروشتة رقمياً كمرض مزمن.",
                      "تُنشأ حصة شهرية في (/pharmacy/chronic-allowances)، وتظهر الروشتة في الصيدلية (/pharmacy/dispensing-queue).",
                      "عند صرف الصيدلي للروشتة: يُخصم الدواء آلياً من المخزن + تُنشأ مطالبة تأمين صحي 80% + يصل إشعار فوري لتطبيق المواطن!",
                    ],
                  },
                  {
                    title: "٤. دورة التحاليل المعملية والأشعة التشخيصية (PACS) والتنبيهات السريرية",
                    steps: [
                      "الطبيب يطلب تحليلاً فورياً من غرفة الكشف، فيستلمه المعمل بالباركود في (/lab/sample-intake).",
                      "يدخل أخصائي المعمل النتائج ويعتمدها في (/lab/results) ويرفع صور الأشعة في (/lab/radiology).",
                      "تظهر النتائج والأشعة فوراً في غرفة كشف الطبيب وفي تطبيق المواطن، وإذا رفع المعمل (Condition Flag) واعتمده الطبيب يُضاف المرض لملف المواطن الدائم!",
                    ],
                  },
                  {
                    title: "٥. دورة الإحالة الحرجة للطوارئ وتسكين الأسرة وبنك الدم",
                    steps: [
                      "الطبيب يرسل إحالة شبكية بهدف (HOSPITAL) ودرجة (CRITICAL).",
                      "ينشئ الخادم أوتوماتيكياً حالة طوارئ (ErCase) في شاشة فرز الطوارئ بالمستشفى (/hospital/er-triage).",
                      "يسكن طاقم الطوارئ المريض في سرير متاح (/hospital/beds-icu) ويحجز له غرفة عمليات ووحدة دم من (/hospital/blood-bank).",
                    ],
                  },
                  {
                    title: "٦. دورة كود المشاركة السري المؤقت (10 دقائق) وسجل الرقابة",
                    steps: [
                      "المواطن يولد كود مشاركة من 10 أحرف في تطبيق الموبايل (POST /v1/me/shares).",
                      "يدخل الطبيب الكود في (/doctor/shared-record) فينفتح له التاريخ المرضي الكامل للمواطن.",
                      "تُسجل عملية الاطلاع في AuditLog وتظهر للمواطن في تطبيقه تحت قسم «سجل الرقابة السيادي: من شاهد ملفي الطبي».",
                    ],
                  },
                ].map((flow, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-outline-variant/50 bg-surface-container-low/50 p-5 space-y-3"
                  >
                    <h3 className="text-sm sm:text-base font-black text-primary">{flow.title}</h3>
                    <ol className="space-y-2">
                      {flow.steps.map((st, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 rounded-xl bg-surface-container-lowest p-3 text-xs leading-relaxed text-on-surface border border-outline-variant/30"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                            {idx + 1}
                          </span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* =================================================================
              CHAPTER 5: CYBERSECURITY & CRYPTOGRAPHY ARCHITECTURE
          ================================================================= */}
          <section id="ch-security" className="scroll-mt-24 space-y-6">
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8 shadow-level-2 space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-tertiary">
                  الفصل الخامس • التأمين السيادي وحماية الخصوصية
                </span>
                <h2 className="mt-1 text-xl sm:text-3xl font-black text-primary">
                  هندسة التشفير السيادي والأمن السيبراني (Defense-in-Depth Security)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  {
                    title: "١. تشفير الرقم القومي بـ AES-256-GCM (Zero-Plaintext Storage)",
                    formula: "v1 : base64(IV_12B) : base64(AuthTag_16B) : base64(Ciphertext)",
                    desc: "لا يُحفظ الرقم القومي كنص صريح أبداً في قاعدة البيانات؛ يتم تشفير كل رقم قومي بمفتاح سري 256-bit مع توليد متجه ابتدائي عشوائي (96-bit IV) وبصمة مصادقة (GCM Auth Tag) تمنع أي تلاعب بالبيانات المشفرة.",
                  },
                  {
                    title: "٢. الفهرس الأعمى للبحث في 120 مليون سجل (HMAC-SHA256 Blind Index)",
                    formula: "nationalIdIdx = HMAC_SHA256(BLIND_INDEX_KEY, nationalId_14_digits)",
                    desc: "للبحث عن رقم قومي مشفر في أقل من مللي ثانية دون فك تشفير الجدول، يولد الخادم بصمة عمياء حتمية بمفتاح منفصل مفهرسة كـ @unique في PostgreSQL، مع دعم البحث الجزئي بالرقم القومي أو كود MTI.",
                  },
                  {
                    title: "٣. تشفير كلمات المرور وتدوير الجلسات (Argon2id + Token Rotation)",
                    formula: "Argon2id Memory-Hard Hash + RefreshToken Family Tracking",
                    desc: "جميع كلمات المرور مشفرة بخوارزمية Argon2id المقاومة لهجمات كروت الشاشة (GPU Cracking)، مع قفل الحساب تلقائياً بعد المحاولات الفاشلة وإبطال عائلة الجلسات عند رصد أي سرقة للتوكن.",
                  },
                  {
                    title: "٤. التوقيع الرقمي للروشتات وشرائح الطوارئ + سجل التدقيق",
                    formula: "SHA-256 Prescription Seal + SHA-256 NFC Token Hash + Immutable AuditLog",
                    desc: "كل روشتة تحمل ختم توقيع رقمي SHA-256، وكل شريحة طوارئ NFC يُحفظ هاش التوكن الخاص بها فقط، وكل حركة في النظام تُسجل في جدول AuditLog غير القابل للتعديل.",
                  },
                ].map((sec, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-outline-variant/50 bg-surface-container-low/50 p-5 space-y-2.5"
                  >
                    <h3 className="text-sm sm:text-base font-black text-primary flex items-center gap-2">
                      <Lock className="h-4 w-4 text-tertiary" />
                      {sec.title}
                    </h3>
                    <div
                      className="rounded-xl bg-surface-container-lowest p-2.5 font-mono text-[11px] font-bold text-secondary border border-outline-variant/40"
                      dir="ltr"
                    >
                      {sec.formula}
                    </div>
                    <p className="text-xs leading-relaxed text-on-surface">{sec.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* =================================================================
              CHAPTER 6: 27 PRISMA DATABASE TABLES & API MODULES
          ================================================================= */}
          <section id="ch-database" className="scroll-mt-24 space-y-6">
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8 shadow-level-2 space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-secondary">
                  الفصل السادس • هيكل قاعدة البيانات والـ APIs
                </span>
                <h2 className="mt-1 text-xl sm:text-3xl font-black text-primary">
                  موسوعة الـ 27 جدولاً في قاعدة البيانات (`Prisma Schema`) والـ 85+ نقطة اتصال
                </h2>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-outline-variant/50">
                <table className="w-full text-xs text-start">
                  <thead className="bg-surface-container text-primary border-b border-outline-variant/40">
                    <tr>
                      <th className="p-3.5 text-start font-black">القطاع</th>
                      <th className="p-3.5 text-start font-black">جداول قاعدة البيانات (Prisma Models)</th>
                      <th className="p-3.5 text-start font-black">المسار البرمجي (API Prefix)</th>
                      <th className="p-3.5 text-start font-black">الوظيفة التفصيلية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 bg-surface-container-lowest">
                    {[
                      {
                        sector: "١. الهوية والأمن السيادي",
                        models: "User, Patient, NfcCard, RefreshToken, AuditLog",
                        api: "/v1/auth/*, /v1/patients/*, /v1/nfc-cards/*, /v1/admin/*",
                        desc: "إدارة حسابات الكوادر والمواطنين، تشفير الرقم القومي، شرائح الطوارئ NFC، تدوير الجلسات، وسجل التدقيق الرقابي.",
                      },
                      {
                        sector: "٢. الاستقبال والمواعيد والطابور",
                        models: "DoctorSchedule, Appointment, Visit, ShareToken",
                        api: "/v1/reception/*, /v1/appointments/*, /v1/queue/*, /v1/schedule/*, /v1/shares/*",
                        desc: "فتح حسابات المواطنين، جداول الأطباء، تأكيد المواعيد، طابور العيادة الذكي، وأكواد مشاركة السجل المؤقتة.",
                      },
                      {
                        sector: "٣. الروشتات والصيدلية والتأمين",
                        models: "Prescription, PrescriptionItem, RenewalRequest, ChronicAllowance, DrugInventory, PharmacyClaim, PharmacySettlement",
                        api: "/v1/prescriptions/*, /v1/renewals/*, /v1/pharmacy/*",
                        desc: "التوقيع الرقمي للروشتات، تجديد المزمن، الحصص الشهرية، جرد المخزن، ومطالبات وتسويات التأمين الصحي الشامل (UHIA).",
                      },
                      {
                        sector: "٤. المعمل المركزي والأشعة PACS",
                        models: "LabSample, LabResult, ConditionFlag, RadiologyUpload, Reagent, LabInstrument, CalibrationRecord",
                        api: "/v1/lab/samples/*, /v1/lab/radiology/*, /v1/lab/instruments/*, /v1/lab/reagents/*",
                        desc: "تتبع العينات بالباركود، النتائج الرقمية، تنبيهات الحساسية للطبيب، صور الأشعة PACS، معايرة الأجهزة، ومخزون الكواشف.",
                      },
                      {
                        sector: "٥. المستشفيات والطوارئ وبنك الدم",
                        models: "ErCase, Bed, OrCase, BloodUnit, Referral",
                        api: "/v1/hospital/er/*, /v1/hospital/beds/*, /v1/hospital/or-cases/*, /v1/hospital/blood-bank/*, /v1/referrals/*",
                        desc: "فرز الطوارئ وتسكين الأسرة، إدارة العناية المركزة، جدول العمليات الجراحية، بنك الدم المركزي، والإحالات الشبكية.",
                      },
                      {
                        sector: "٦. الوزارات الأربع وتطبيق المواطن",
                        models: "PushNotification, PushToken, Document + Quad-Ministry Aggregations",
                        api: "/v1/analytics/*, /v1/me/*, /v1/notifications/*",
                        desc: "محرك الوزارات الأربع (الصحة، التعليم العالي، التموين، القوى العاملة)، الملخص السيادي للمواطن، والإشعارات الفورية.",
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/50">
                        <td className="p-3.5 font-black text-primary">{row.sector}</td>
                        <td className="p-3.5 font-mono text-[11px] font-bold text-secondary" dir="ltr">
                          {row.models}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-tertiary" dir="ltr">
                          {row.api}
                        </td>
                        <td className="p-3.5 text-on-surface leading-relaxed">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* =================================================================
              CHAPTER 7: LIVE DEMO SCRIPT & CREDENTIALS TABLE
          ================================================================= */}
          <section id="ch-demo" className="scroll-mt-24 space-y-6">
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8 shadow-level-2 space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-secondary">
                  الفصل السابع • دليل المناقشة العملي والحسابات الجاهزة
                </span>
                <h2 className="mt-1 text-xl sm:text-3xl font-black text-primary flex items-center gap-2">
                  <Award className="h-7 w-7 text-secondary" />
                  خطة العرض العملي أمام الدكتورة + جميع الحسابات التجريبية الجاهزة
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
                  كلمة المرور الموحدة لجميع الحسابات هي:{" "}
                  <code className="rounded-lg bg-surface-container px-2.5 py-1 font-mono font-bold text-primary">
                    MnisDemo#2026!Secure
                  </code>{" "}
                  (أو يمكنك الدخول بضغطة زر واحدة مباشرة من صفحة <Link href="/login" className="text-secondary underline font-bold">/login</Link>)
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-outline-variant/50">
                <table className="w-full text-xs text-start">
                  <thead className="bg-surface-container text-primary border-b border-outline-variant/40">
                    <tr>
                      <th className="p-3.5 text-start font-black">الدور / القطاع</th>
                      <th className="p-3.5 text-start font-black">البريد الإلكتروني / الرقم القومي</th>
                      <th className="p-3.5 text-start font-black">كلمة المرور</th>
                      <th className="p-3.5 text-start font-black">انتقال مباشر للشاشة الحية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 bg-surface-container-lowest">
                    {[
                      { role: "الطبيب الاستشاري (DOCTOR)", login: "doctor@mnis.demo", href: "/doctor/queue" },
                      { role: "الصيدلي الإكلينيكي (PHARMACIST)", login: "pharmacist@mnis.demo", href: "/pharmacy/dispensing-queue" },
                      { role: "أخصائي المعمل والأشعة (LAB_TECH)", login: "lab1@mnis.demo", href: "/lab/sample-intake" },
                      { role: "طاقم المستشفى والطوارئ (HOSPITAL_STAFF)", login: "er@mnis.demo", href: "/hospital/er-triage" },
                      { role: "موظف الاستقبال (RECEPTIONIST)", login: "reception@mnis.demo", href: "/reception/citizens" },
                      { role: "القيادة والـ 4 وزارات (EXECUTIVE)", login: "exec@mnis.demo", href: "/analytics/ministries" },
                      { role: "مدير النظام والأمن السيادي (ADMIN)", login: "admin@mnis.demo", href: "/admin/users" },
                      { role: "المواطن على تطبيق الموبايل (أحمد محمد علي)", login: "29304151234567 (MTI-EG-2930415)", href: "/emergency?token=NFC-EG-DEMO-001" },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-surface-container-low/50">
                        <td className="p-3.5 font-bold text-on-surface">{r.role}</td>
                        <td className="p-3.5 font-mono font-bold text-primary" dir="ltr">{r.login}</td>
                        <td className="p-3.5 font-mono text-tertiary" dir="ltr">MnisDemo#2026!Secure</td>
                        <td className="p-3.5">
                          <Link
                            href={r.href}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-on-primary hover:opacity-90"
                          >
                            <span>فتح القطاع</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
