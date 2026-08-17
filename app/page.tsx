'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  ArrowUpLeft,
  BarChart3,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  ExternalLink,
  Link2,
  LifeBuoy,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'المزايا', href: '#features' },
  { label: 'كيف تعمل', href: '#how-it-works' },
  { label: 'الأسعار', href: '#pricing' },
  { label: 'الأسئلة الشائعة', href: '#faq' },
]

const plans = [
  {
    name: 'Starter',
    arabicName: 'البداية',
    description: 'كل ما تحتاجه لإدارة حسابك التعليمي باحتراف.',
    monthly: 19,
    yearly: 15,
    featured: false,
    features: ['مدرس واحد وWorkspace واحد', 'رابط LMS واحد', 'فواتير واشتراك واضح', 'دعم عبر التذاكر'],
  },
  {
    name: 'Growth',
    arabicName: 'النمو',
    description: 'للمدرسين الذين يريدون مساحة عمل أكثر تنظيمًا.',
    monthly: 39,
    yearly: 31,
    featured: true,
    features: ['حتى 5 أعضاء في الفريق', 'فحص دوري لرابط LMS', 'تقارير SaaS أوسع', 'دعم أسرع وأولوية في المتابعة'],
  },
  {
    name: 'Academy',
    arabicName: 'الأكاديمية',
    description: 'إدارة متقدمة للأكاديميات والفرق التعليمية.',
    monthly: 79,
    yearly: 63,
    featured: false,
    features: ['Workspaces وأعضاء أكثر', 'لوحة تحكم متقدمة', 'تقارير تبنّي واستخدام', 'إدارة دعم ذات أولوية'],
  },
]

const faqs = [
  {
    question: 'هل تقوم المنصة بإنشاء LMS جديد لي؟',
    answer: 'لا. مركزية هي منصة SaaS مستقلة لإدارة حسابك واشتراكك وفواتيرك وروابط منصتك. يمكنك إضافة رابط LMS موجود وفتحه من مكان واحد، لكننا لا ننشئ أو ننسخ أو نشغّل منصة تعليمية نيابة عنك.',
  },
  {
    question: 'ماذا يحدث بعد الدفع؟',
    answer: 'يتم تفعيل اشتراكك داخل مركزية فقط بعد تأكيد الدفع من بوابة الدفع. بعدها يمكنك إضافة رابط منصتك التعليمية أو طلب مساعدة فريق الدعم.',
  },
  {
    question: 'هل تحتاجون إلى قاعدة بيانات الـ LMS؟',
    answer: 'لا. لا نطلب اتصالًا مباشرًا بقاعدة بيانات LMS. أي بيانات إضافية مستقبلية تصل فقط عبر API رسمي أو تكامل موثق وبصلاحيات واضحة.',
  },
  {
    question: 'هل يمكنني استخدام المنصة دون ربط LMS؟',
    answer: 'نعم. يعمل حسابك واشتراكك وفواتيرك ودعمك بشكل مستقل. ستظهر حالة واضحة بأن الحساب نشط دون رابط LMS حتى تضيف الرابط لاحقًا.',
  },
]

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="section-eyebrow"><span className="eyebrow-dot" />{children}</div>
}

export default function Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <main className="site-shell">
      <div className="announcement-bar">
        <span className="announcement-pulse" />
        <span>إدارة أبسط لمنصتك التعليمية</span>
        <a href="#how-it-works">اكتشف كيف تعمل <ArrowLeft size={14} /></a>
      </div>

      <header className="site-header">
        <a href="#top" className="brand" aria-label="مركزية، الصفحة الرئيسية">
          <BrandMark />
          <span>مركزية</span>
        </a>

        <nav id="main-navigation" className={`main-nav ${mobileMenuOpen ? 'is-open' : ''}`}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>{item.label}</a>
          ))}
          <a href="#contact" onClick={() => setMobileMenuOpen(false)}>تواصل معنا</a>
          <div className="mobile-nav-actions">
            <a href="#login" className="button button-ghost">تسجيل الدخول</a>
            <a href="#pricing" className="button button-dark">ابدأ الآن <ArrowLeft size={16} /></a>
          </div>
        </nav>

        <div className="header-actions">
          <a href="#login" className="login-link">تسجيل الدخول</a>
          <a href="#pricing" className="button button-dark header-cta">ابدأ الآن <ArrowLeft size={16} /></a>
          <button type="button" className="menu-toggle" onClick={() => setMobileMenuOpen((value) => !value)} aria-expanded={mobileMenuOpen} aria-controls="main-navigation" aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <section id="top" className="hero-section section-container">
        <div className="hero-copy">
          <SectionEyebrow>منصة تشغيل أعمالك التعليمية</SectionEyebrow>
          <h1>كل ما يخص اشتراكك<br /><em>في مكان واحد.</em></h1>
          <p className="hero-lede">مركزية تساعدك على إدارة حسابك، باقتك، فواتيرك، ورابط منصتك التعليمية دون تعقيد. أنت تملك منصتك، ونحن ننظم علاقتك بها.</p>
          <div className="hero-actions">
            <a href="#pricing" className="button button-dark button-large">ابدأ تجربتك الآن <ArrowLeft size={18} /></a>
            <a href="#how-it-works" className="text-link"><span className="play-icon"><Play size={12} fill="currentColor" /></span> شاهد كيف تعمل</a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span className="avatar avatar-one">م</span>
              <span className="avatar avatar-two">س</span>
              <span className="avatar avatar-three">ن</span>
              <span className="avatar avatar-four">+</span>
            </div>
            <div><strong>مصممة للمدرسين</strong><span>واضحة من أول خطوة</span></div>
            <div className="proof-divider" />
            <div className="proof-stat"><strong>100%</strong><span>وضوح في البيانات</span></div>
          </div>
        </div>

        <div className="hero-visual" aria-label="معاينة لوحة تحكم مركزية">
          <div className="visual-glow" />
          <div className="dashboard-window">
            <div className="window-topbar"><div className="window-dots"><i /><i /><i /></div><span>app.markazia.co</span><div className="window-status"><span /> متصل</div></div>
            <div className="dashboard-content">
              <aside className="preview-sidebar">
                <div className="preview-brand"><BrandMark /><b>مركزية</b></div>
                <div className="preview-workspace"><span className="workspace-avatar">أ</span><span><b>أكاديمية النور</b><small>حساب المدرس</small></span><ChevronDown size={13} /></div>
                <div className="preview-nav-label">المساحة الرئيسية</div>
                <div className="preview-nav-item active"><BarChart3 size={15} /> نظرة عامة</div>
                <div className="preview-nav-item"><WalletCards size={15} /> الاشتراك والفوترة</div>
                <div className="preview-nav-item"><Link2 size={15} /> رابط المنصة</div>
                <div className="preview-nav-item"><LifeBuoy size={15} /> الدعم</div>
                <div className="preview-sidebar-bottom"><div className="mini-avatar">أ</div><span>أحمد علي<small>المالك</small></span><ArrowUpLeft size={13} /></div>
              </aside>
              <div className="preview-main">
                <div className="preview-header"><div><span className="preview-kicker">الثلاثاء، 17 يونيو 2025</span><h3>صباح الخير، أحمد <span>✦</span></h3></div><div className="notification-dot"><span /></div></div>
                <div className="preview-alert"><div className="alert-icon"><Link2 size={16} /></div><div><b>أضف رابط منصتك التعليمية</b><span>حسابك نشط. اربط منصتك للوصول إليها من هنا.</span></div><ArrowLeft size={16} /></div>
                <div className="preview-metrics"><div className="preview-card"><span>الباقة الحالية</span><strong>Growth</strong><small>تتجدد في 17 يوليو 2025</small><div className="card-link">إدارة الباقة <ArrowLeft size={12} /></div></div><div className="preview-card"><span>حالة الحساب</span><strong className="green-text"><CircleCheck size={18} /> نشط</strong><small>كل شيء يعمل بشكل جيد</small><div className="status-line"><i /><i /><i /><i /><i /></div></div></div>
                <div className="preview-bottom"><div className="preview-panel"><div className="panel-heading"><b>نشاط الحساب</b><span>آخر 30 يومًا</span></div><div className="chart"><span className="chart-y y1">100%</span><span className="chart-y y2">50%</span><span className="chart-y y3">0%</span><svg viewBox="0 0 330 108" preserveAspectRatio="none"><path d="M0 83 C25 78, 24 60, 50 66 S82 80, 104 56 S136 76, 158 62 S190 48, 208 55 S232 29, 250 38 S280 54, 298 29 S318 21, 330 11" fill="none" stroke="#ee794e" strokeWidth="3" strokeLinecap="round" /><path d="M0 83 C25 78, 24 60, 50 66 S82 80, 104 56 S136 76, 158 62 S190 48, 208 55 S232 29, 250 38 S280 54, 298 29 S318 21, 330 11 L330 108 L0 108 Z" fill="url(#chartFill)" opacity=".6" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ee794e" stopOpacity=".22" /><stop offset="1" stopColor="#ee794e" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-x"><span>18 مايو</span><span>25 مايو</span><span>1 يونيو</span><span>8 يونيو</span><span>15 يونيو</span></div></div></div><div className="preview-panel connection-panel"><div className="panel-heading"><b>رابط المنصة</b><span className="tiny-live"><i /> غير مضاف</span></div><div className="empty-connection"><div className="empty-icon"><Link2 size={18} /></div><span>أضف رابط LMS الخاص بك<br />للوصول السريع والتحقق من حالته.</span><button type="button" aria-label="إضافة رابط المنصة">إضافة رابط <ArrowLeft size={12} /></button></div></div></div>
              </div>
            </div>
          </div>
          <div className="floating-note note-one"><span className="note-icon green"><ShieldCheck size={14} /></span><span><b>بياناتك في أمان</b><small>صلاحيات واضحة دائمًا</small></span></div>
          <div className="floating-note note-two"><span className="note-icon orange"><CircleCheck size={14} /></span><span><b>اشتراكك نشط</b><small>آخر تحقق منذ لحظات</small></span></div>
        </div>
      </section>

      <section className="logo-strip section-container"><span>كل شيء واضح، من أول يوم</span><div className="logo-line"><b><span className="logo-square" /> EDUFLOW</b><b><span className="logo-circle" /> أكاديمية</b><b><span className="logo-lines" /> معلم+</b><b><span className="logo-spark" /> classly</b></div></section>

      <section id="features" className="features-section section-container section-space">
        <div className="section-heading centered"><SectionEyebrow>صممت حول احتياجك</SectionEyebrow><h2>أقل تشتيتًا.<br /><em>أكثر سيطرة.</em></h2><p>بدل التنقل بين أدوات كثيرة، اجمع أهم تفاصيل عملك التعليمي في مساحة واحدة مصممة لتفهمها بسرعة.</p></div>
        <div className="feature-grid"><article className="feature-card feature-card-large"><div className="feature-icon peach"><WalletCards size={21} /></div><span className="card-label">01 / الاشتراك والفوترة</span><h3>اعرف أين تقف،<br />دون مفاجآت.</h3><p>تتبّع باقتك، فواتيرك، موعد التجديد، ووسيلة الدفع في لوحة واحدة واضحة.</p><div className="invoice-mini"><div><span className="mini-invoice-icon"><WalletCards size={14} /></span><span><b>فاتورة #MK-0048</b><small>17 يونيو 2025</small></span></div><strong>مدفوعة <CircleCheck size={13} /></strong></div></article><article className="feature-card dark-card"><div className="feature-icon dark-icon"><Link2 size={21} /></div><span className="card-label">02 / رابط منصتك</span><h3>من حسابك<br />إلى منصتك.</h3><p>احفظ رابط الـ LMS الموجود لديك، وافتحه متى احتجت دون أن نخلط بين النظامين.</p><div className="link-preview"><span className="link-dot" /><span>academy.example.com</span><ExternalLink size={14} /></div></article><article className="feature-card feature-card-wide"><div><div className="feature-icon blue"><BarChart3 size={21} /></div><span className="card-label">03 / تقارير حقيقية</span><h3>الأرقام التي<br /><em>يمكنك الوثوق بها.</em></h3><p>نُظهر فقط البيانات التي يملك SaaS مصدرًا حقيقيًا لها، مع وقت آخر تحديث ومصدرها الواضح.</p></div><div className="metric-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><BarChart3 size={18} /><b>98%</b><small>وضوح</small></div><span className="orbit-label label-top">مصدر موثوق</span><span className="orbit-label label-right">آخر تحديث</span></div></article></div>
      </section>

      <section id="how-it-works" className="workflow-section section-space"><div className="section-container workflow-inner"><div className="workflow-copy"><SectionEyebrow>كيف تعمل</SectionEyebrow><h2>ابدأ في دقائق،<br /><em>واعرف طريقك.</em></h2><p>لا إعدادات معقدة ولا وعود غامضة. خطوات قصيرة تأخذك من التسجيل إلى إدارة اشتراكك بكل وضوح.</p><a href="#pricing" className="button button-dark">ابدأ الآن <ArrowLeft size={16} /></a></div><div className="steps-list"><div className="step-item active"><span className="step-number">01</span><div><h3>أنشئ حسابك</h3><p>سجّل بياناتك التجارية وأنشئ مساحة عملك في مركزية.</p></div><CircleCheck size={19} /></div><div className="step-item"><span className="step-number">02</span><div><h3>اختر باقتك</h3><p>قارن المزايا والأسعار واختر ما يناسب مرحلتك الحالية.</p></div><span className="step-arrow">←</span></div><div className="step-item"><span className="step-number">03</span><div><h3>أضف رابط منصتك</h3><p>أدخل رابط الـ LMS الموجود لديك، أو افعل ذلك لاحقًا.</p></div><span className="step-arrow">←</span></div><div className="step-item"><span className="step-number">04</span><div><h3>أدر عملك بثقة</h3><p>تابع فواتيرك، فريقك، دعمك، وبياناتك من مكان واحد.</p></div><span className="step-arrow">←</span></div></div></div></section>

      <section id="pricing" className="pricing-section section-container section-space"><div className="section-heading centered"><SectionEyebrow>خطط تناسب مرحلتك</SectionEyebrow><h2>ابدأ صغيرًا،<br /><em>وتوسع بثقة.</em></h2><p>أسعار واضحة بلا حدود مخفية. كل الخطط تدير SaaS الخاص بك، ولا تدّعي امتلاك موارد LMS لا نقيسها.</p><div className="billing-toggle"><button type="button" className={!annual ? 'selected' : ''} aria-pressed={!annual} onClick={() => setAnnual(false)}>شهري</button><button type="button" className={annual ? 'selected' : ''} aria-pressed={annual} onClick={() => setAnnual(true)}>سنوي <span>وفر 20%</span></button></div></div><div className="plans-grid">{plans.map((plan) => <article className={`plan-card ${plan.featured ? 'featured-plan' : ''}`} key={plan.name}>{plan.featured && <div className="popular-pill">الأكثر اختيارًا</div>}<div className="plan-top"><div><span className="plan-name">{plan.arabicName}</span><small>{plan.name}</small></div><Sparkles size={19} /></div><p>{plan.description}</p><div className="price"><strong>${annual ? plan.yearly : plan.monthly}</strong><span>/ شهر</span></div>{annual && <div className="annual-note">تُدفع سنويًا · وفّر 20%</div>}<a href="#contact" className={`button ${plan.featured ? 'button-light' : 'button-outline'} plan-button`}>ابدأ مع {plan.arabicName} <ArrowLeft size={15} /></a><div className="plan-divider" /><span className="includes">تشمل الخطة:</span><ul>{plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}</ul></article>)}</div></section>

      <section className="clarity-section section-space"><div className="section-container clarity-inner"><div className="clarity-quote"><span className="quote-mark">“</span><h2>منصتك ملكك.<br /><em>إدارتك أسهل.</em></h2><p>مركزية لا تستبدل منصتك التعليمية، ولا تلمس بيانات طلابك. هي طبقة الإدارة الواضحة التي تجعل علاقتك بخدماتك أبسط.</p></div><div className="clarity-points"><div><ShieldCheck size={18} /><span><b>خصوصية أولًا</b><small>لا اتصال مباشر بقاعدة بيانات LMS.</small></span></div><div><Link2 size={18} /><span><b>ربط اختياري</b><small>ابدأ برابط فقط، وتكامل لاحقًا عند الحاجة.</small></span></div><div><CircleCheck size={18} /><span><b>بيانات صادقة</b><small>لا أرقام بلا مصدر أو تاريخ تحديث.</small></span></div></div></div></section>

      <section id="faq" className="faq-section section-container section-space"><div className="faq-heading"><SectionEyebrow>أسئلة شائعة</SectionEyebrow><h2>وضوح قبل<br /><em>أن تبدأ.</em></h2><p>إذا لم تجد إجابتك، فريق الدعم جاهز لمساعدتك.</p><a href="#contact" className="text-link">تواصل مع الدعم <ArrowLeft size={15} /></a></div><div className="faq-list">{faqs.map((faq, index) => <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={faq.question}><button type="button" id={`faq-trigger-${index}`} aria-expanded={openFaq === index} aria-controls={`faq-panel-${index}`} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{faq.question}</span><ChevronDown size={18} /></button>{openFaq === index && <p id={`faq-panel-${index}`}>{faq.answer}</p>}</div>)}</div></section>

      <section id="contact" className="cta-section section-container"><div className="cta-card"><div className="cta-pattern" /><div className="cta-copy"><SectionEyebrow>الخطوة التالية لك</SectionEyebrow><h2>خلّ إدارة منصتك<br /><em>أبسط من اليوم.</em></h2><p>أنشئ حسابك في دقائق، وابدأ برؤية كل ما يخص SaaS الخاص بك في مكان واحد.</p><a href="#pricing" className="button button-light button-large">ابدأ مجانًا <ArrowLeft size={18} /></a></div><div className="cta-orbit"><div className="cta-orbit-ring ring-a" /><div className="cta-orbit-ring ring-b" /><div className="cta-orbit-core"><BrandMark /><span>مركزية</span></div><div className="orbit-tag tag-a"><CircleCheck size={14} /> اشتراك نشط</div><div className="orbit-tag tag-b"><Link2 size={14} /> رابط LMS</div><div className="orbit-tag tag-c"><BarChart3 size={14} /> تقارير واضحة</div></div></div></section>

      <footer className="site-footer section-container"><div className="footer-main"><div className="footer-brand"><a href="#top" className="brand"><BrandMark /><span>مركزية</span></a><p>مساحة واحدة لإدارة اشتراكك ومنصتك التعليمية بوضوح.</p></div><div className="footer-links"><div><b>المنتج</b><a href="#features">المزايا</a><a href="#how-it-works">كيف تعمل</a><a href="#pricing">الأسعار</a></div><div><b>المساعدة</b><a href="#faq">الأسئلة الشائعة</a><a href="#contact">تواصل معنا</a><a href="#contact">حالة النظام</a></div><div><b>قانوني</b><a href="#contact">الخصوصية</a><a href="#contact">الشروط</a><a href="#contact">سياسة الاسترداد</a></div></div></div><div className="footer-bottom"><span>© 2025 مركزية. جميع الحقوق محفوظة.</span><span className="footer-note"><Clock3 size={14} /> مبنية للوضوح، لا للتعقيد.</span></div></footer>
    </main>
  )
}
