import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Localization from 'expo-localization';

const LANGUAGES = ['en', 'it', 'es', 'fr', 'de', 'ar'] as const;
type AppLanguage = (typeof LANGUAGES)[number];

type ScreenName = 'landing' | 'signup' | 'goal' | 'payment' | 'confirmation' | 'dashboard' | 'admin';

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  preferredLanguage: AppLanguage;
  acceptedTerms: boolean;
  verified: boolean;
};

type GoalData = {
  title: string;
  description: string;
  category: 'travel' | 'education' | 'health' | 'family' | 'business' | 'other';
  amount: number;
  photo: string;
  status: 'draft' | 'pending' | 'active';
};

type PaymentData = {
  method: 'card' | 'apple' | 'google';
  amount: number;
  paid: boolean;
  reference: string;
  date: string;
};

type GoalRow = {
  id: number;
  user: string;
  country: string;
  language: AppLanguage;
  category: GoalData['category'];
  raised: number;
  status: 'approved' | 'review' | 'rejected';
};

const currency = (value: number) => `€${value.toLocaleString('it-IT')}`;

const translations = {
  en: {
    nav: { dashboard: 'Dashboard', admin: 'Admin', language: 'Language' },
    landing: {
      eyebrow: 'SUPPORT DREAMS',
      title: 'Turn your personal goal into reality.',
      subtitle: 'GoalFund helps you launch a campaign, tell your story and receive support from friends, family and the community.',
      cta: 'Reach your goal',
      howItWorks: 'How it works',
      steps: ['Create your profile', 'Describe your goal', 'Pay the participation fee', 'Track progress'],
      trust: 'Transparent, secure and motivating.'
    },
    signup: {
      title: 'Create your account',
      subtitle: 'Start your campaign in a few steps.',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
      country: 'Country',
      preferredLanguage: 'Preferred language',
      acceptTerms: 'I accept the terms and privacy policy',
      button: 'Continue'
    },
    goal: {
      title: 'Your goal',
      category: 'Category',
      amount: 'Estimated amount',
      photo: 'Optional photo',
      titleField: 'Goal title',
      description: 'Description',
      button: 'Continue to payment',
      categories: { travel: 'Travel', education: 'Education', health: 'Health', family: 'Family', business: 'Business', other: 'Other' }
    },
    payment: {
      title: 'Participation fee',
      subtitle: 'A one-time €10 fee activates your campaign after confirmation.',
      payNow: 'Pay €10',
      secure: 'Secure checkout powered by Stripe',
      methods: { card: 'Card', apple: 'Apple Pay', google: 'Google Pay' },
      cardName: 'Name on card',
      cardNumber: 'Card number',
      expiry: 'Expiry',
      cvc: 'CVC',
      summary: 'Campaign summary'
    },
    confirmation: {
      title: 'You are almost there!',
      summary: 'Goal summary',
      goal: 'Goal',
      amount: 'Amount',
      status: 'Status',
      dashboard: 'Go to dashboard',
      emailSent: 'A confirmation email was sent.'
    },
    dashboard: {
      title: 'My dashboard',
      status: 'Participation status',
      active: 'Goal active',
      draft: 'Draft',
      paymentHistory: 'Payment history',
      fee: 'Participation fee'
    },
    admin: {
      title: 'Admin panel',
      total: 'Total funds raised',
      export: 'Export CSV',
      list: 'Moderation list',
      approve: 'Approve',
      reject: 'Reject'
    }
  },
  it: {
    nav: { dashboard: 'Dashboard', admin: 'Admin', language: 'Lingua' },
    landing: {
      eyebrow: 'SOSTIENI I SOGNI',
      title: 'Trasforma il tuo obiettivo personale in realtà.',
      subtitle: 'GoalFund ti aiuta a lanciare una campagna, raccontare la tua storia e ricevere sostegno da amici, famiglia e comunità.',
      cta: 'Raggiungi il tuo obiettivo',
      howItWorks: 'Come funziona',
      steps: ['Crea il tuo profilo', 'Descrivi il tuo obiettivo', 'Paga la quota di partecipazione', 'Monitora i progressi'],
      trust: 'Trasparente, sicuro e motivante.'
    },
    signup: {
      title: 'Crea il tuo account',
      subtitle: 'Avvia la tua campagna in pochi passi.',
      firstName: 'Nome',
      lastName: 'Cognome',
      email: 'Email',
      password: 'Password',
      country: 'Paese',
      preferredLanguage: 'Lingua preferita',
      acceptTerms: 'Accetto i termini e la privacy policy',
      button: 'Continua'
    },
    goal: {
      title: 'Il tuo obiettivo',
      category: 'Categoria',
      amount: 'Importo stimato',
      photo: 'Foto opzionale',
      titleField: 'Titolo dell’obiettivo',
      description: 'Descrizione',
      button: 'Continua al pagamento',
      categories: { travel: 'Viaggio', education: 'Istruzione', health: 'Salute', family: 'Famiglia', business: 'Business', other: 'Altro' }
    },
    payment: {
      title: 'Quota di partecipazione',
      subtitle: 'Una quota unica di €10 attiva la tua campagna dopo la conferma.',
      payNow: 'Paga €10',
      secure: 'Checkout sicuro tramite Stripe',
      methods: { card: 'Carta', apple: 'Apple Pay', google: 'Google Pay' },
      cardName: 'Intestatario',
      cardNumber: 'Numero carta',
      expiry: 'Scadenza',
      cvc: 'CVC',
      summary: 'Riepilogo campagna'
    },
    confirmation: {
      title: 'Ci sei quasi!',
      summary: 'Riepilogo obiettivo',
      goal: 'Obiettivo',
      amount: 'Importo',
      status: 'Stato',
      dashboard: 'Vai alla dashboard',
      emailSent: 'È stata inviata un’email di conferma.'
    },
    dashboard: {
      title: 'La mia dashboard',
      status: 'Stato di partecipazione',
      active: 'Obiettivo attivo',
      draft: 'Bozza',
      paymentHistory: 'Storico pagamenti',
      fee: 'Quota di partecipazione'
    },
    admin: {
      title: 'Pannello admin',
      total: 'Totale fondi raccolti',
      export: 'Esporta CSV',
      list: 'Lista moderazione',
      approve: 'Approva',
      reject: 'Rifiuta'
    }
  },
  es: {
    nav: { dashboard: 'Panel', admin: 'Admin', language: 'Idioma' },
    landing: {
      eyebrow: 'APOYA SUEÑOS',
      title: 'Haz realidad tu objetivo personal.',
      subtitle: 'GoalFund te ayuda a lanzar una campaña, contar tu historia y recibir apoyo de amigos, familia y comunidad.',
      cta: 'Alcanza tu meta',
      howItWorks: 'Cómo funciona',
      steps: ['Crea tu perfil', 'Describe tu meta', 'Paga la cuota de participación', 'Sigue el progreso'],
      trust: 'Transparente, seguro y motivador.'
    },
    signup: {
      title: 'Crea tu cuenta',
      subtitle: 'Empieza tu campaña en pocos pasos.',
      firstName: 'Nombre',
      lastName: 'Apellidos',
      email: 'Correo',
      password: 'Contraseña',
      country: 'País',
      preferredLanguage: 'Idioma preferido',
      acceptTerms: 'Acepto los términos y la política de privacidad',
      button: 'Continuar'
    },
    goal: {
      title: 'Tu meta',
      category: 'Categoría',
      amount: 'Cantidad estimada',
      photo: 'Foto opcional',
      titleField: 'Título de la meta',
      description: 'Descripción',
      button: 'Continuar al pago',
      categories: { travel: 'Viajes', education: 'Educación', health: 'Salud', family: 'Familia', business: 'Negocios', other: 'Otro' }
    },
    payment: {
      title: 'Cuota de participación',
      subtitle: 'Una cuota única de €10 activa tu campaña después de la confirmación.',
      payNow: 'Pagar €10',
      secure: 'Pago seguro con Stripe',
      methods: { card: 'Tarjeta', apple: 'Apple Pay', google: 'Google Pay' },
      cardName: 'Titular',
      cardNumber: 'Número de tarjeta',
      expiry: 'Vencimiento',
      cvc: 'CVC',
      summary: 'Resumen de la campaña'
    },
    confirmation: {
      title: '¡Ya casi está!',
      summary: 'Resumen de la meta',
      goal: 'Meta',
      amount: 'Cantidad',
      status: 'Estado',
      dashboard: 'Ir al panel',
      emailSent: 'Se envió un correo de confirmación.'
    },
    dashboard: {
      title: 'Mi panel',
      status: 'Estado de participación',
      active: 'Meta activa',
      draft: 'Borrador',
      paymentHistory: 'Historial de pagos',
      fee: 'Cuota de participación'
    },
    admin: {
      title: 'Panel admin',
      total: 'Total recaudado',
      export: 'Exportar CSV',
      list: 'Lista de moderación',
      approve: 'Aprobar',
      reject: 'Rechazar'
    }
  },
  fr: {
    nav: { dashboard: 'Tableau', admin: 'Admin', language: 'Langue' },
    landing: {
      eyebrow: 'SOUTENEZ LES RÊVES',
      title: 'Transformez votre objectif en réalité.',
      subtitle: 'GoalFund vous aide à lancer une campagne, partager votre histoire et recevoir du soutien.',
      cta: 'Atteignez votre objectif',
      howItWorks: 'Comment ça marche',
      steps: ['Créez votre profil', 'Décrivez votre objectif', 'Payez les frais', 'Suivez les progrès'],
      trust: 'Transparent, sûr et motivant.'
    },
    signup: {
      title: 'Créez votre compte',
      subtitle: 'Lancez votre campagne en quelques étapes.',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'E-mail',
      password: 'Mot de passe',
      country: 'Pays',
      preferredLanguage: 'Langue préférée',
      acceptTerms: 'J’accepte les termes et la politique de confidentialité',
      button: 'Continuer'
    },
    goal: {
      title: 'Votre objectif',
      category: 'Catégorie',
      amount: 'Montant estimé',
      photo: 'Photo facultative',
      titleField: 'Titre de l’objectif',
      description: 'Description',
      button: 'Continuer au paiement',
      categories: { travel: 'Voyage', education: 'Éducation', health: 'Santé', family: 'Famille', business: 'Business', other: 'Autre' }
    },
    payment: {
      title: 'Frais de participation',
      subtitle: 'Un frais unique de €10 active votre campagne après confirmation.',
      payNow: 'Payer €10',
      secure: 'Paiement sécurisé via Stripe',
      methods: { card: 'Carte', apple: 'Apple Pay', google: 'Google Pay' },
      cardName: 'Nom du titulaire',
      cardNumber: 'Numéro de carte',
      expiry: 'Expiration',
      cvc: 'CVC',
      summary: 'Résumé de la campagne'
    },
    confirmation: {
      title: 'On y est presque !',
      summary: 'Résumé de l’objectif',
      goal: 'Objectif',
      amount: 'Montant',
      status: 'Statut',
      dashboard: 'Aller au tableau',
      emailSent: 'Un e-mail de confirmation a été envoyé.'
    },
    dashboard: {
      title: 'Mon tableau',
      status: 'Statut de participation',
      active: 'Objectif actif',
      draft: 'Brouillon',
      paymentHistory: 'Historique des paiements',
      fee: 'Frais de participation'
    },
    admin: {
      title: 'Panneau admin',
      total: 'Total collecté',
      export: 'Exporter CSV',
      list: 'Liste de modération',
      approve: 'Approuver',
      reject: 'Refuser'
    }
  },
  de: {
    nav: { dashboard: 'Dashboard', admin: 'Admin', language: 'Sprache' },
    landing: {
      eyebrow: 'UNTERSTÜTZE TRÄUME',
      title: 'Mach dein persönliches Ziel zur Realität.',
      subtitle: 'GoalFund hilft dir dabei, eine Kampagne zu starten, deine Geschichte zu teilen und Unterstützung zu erhalten.',
      cta: 'Erreiche dein Ziel',
      howItWorks: 'So funktioniert’s',
      steps: ['Erstelle dein Profil', 'Beschreibe dein Ziel', 'Zahle die Gebühr', 'Verfolge den Fortschritt'],
      trust: 'Transparent, sicher und motivierend.'
    },
    signup: {
      title: 'Erstelle dein Konto',
      subtitle: 'Starte deine Kampagne in wenigen Schritten.',
      firstName: 'Vorname',
      lastName: 'Nachname',
      email: 'E-Mail',
      password: 'Passwort',
      country: 'Land',
      preferredLanguage: 'Bevorzugte Sprache',
      acceptTerms: 'Ich akzeptiere die AGB und Datenschutzbestimmungen',
      button: 'Weiter'
    },
    goal: {
      title: 'Dein Ziel',
      category: 'Kategorie',
      amount: 'Geschätzter Betrag',
      photo: 'Optionales Foto',
      titleField: 'Zieltitel',
      description: 'Beschreibung',
      button: 'Weiter zur Zahlung',
      categories: { travel: 'Reisen', education: 'Bildung', health: 'Gesundheit', family: 'Familie', business: 'Business', other: 'Sonstiges' }
    },
    payment: {
      title: 'Teilnahmegebühr',
      subtitle: 'Eine einmalige Gebühr von €10 aktiviert deine Kampagne nach Bestätigung.',
      payNow: '€10 bezahlen',
      secure: 'Sicherer Checkout mit Stripe',
      methods: { card: 'Karte', apple: 'Apple Pay', google: 'Google Pay' },
      cardName: 'Name auf der Karte',
      cardNumber: 'Kartennummer',
      expiry: 'Ablauf',
      cvc: 'CVC',
      summary: 'Kampagnenübersicht'
    },
    confirmation: {
      title: 'Du bist fast fertig!',
      summary: 'Zielzusammenfassung',
      goal: 'Ziel',
      amount: 'Betrag',
      status: 'Status',
      dashboard: 'Zum Dashboard',
      emailSent: 'Eine Bestätigungs-E-Mail wurde gesendet.'
    },
    dashboard: {
      title: 'Mein Dashboard',
      status: 'Teilnahme status',
      active: 'Aktives Ziel',
      draft: 'Entwurf',
      paymentHistory: 'Zahlungsverlauf',
      fee: 'Teilnahmegebühr'
    },
    admin: {
      title: 'Admin-Bereich',
      total: 'Gesamt gesammelt',
      export: 'CSV exportieren',
      list: 'Moderationsliste',
      approve: 'Genehmigen',
      reject: 'Ablehnen'
    }
  },
  ar: {
    nav: { dashboard: 'لوحة التحكم', admin: 'الإدارة', language: 'اللغة' },
    landing: {
      eyebrow: 'ادعم الأحلام',
      title: 'حول هدفك الشخصي إلى حقيقة.',
      subtitle: 'يساعدك GoalFund على إطلاق حملة ومشاركة قصتك والحصول على الدعم.',
      cta: 'حقق هدفك',
      howItWorks: 'كيف يعمل',
      steps: ['أنشئ ملفك', 'صف هدفك', 'ادفع الرسوم', 'تابع التقدم'],
      trust: 'شفاف وآمن ومشجع.'
    },
    signup: {
      title: 'أنشئ حسابك',
      subtitle: 'ابدأ حملتك في بضع خطوات.',
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      country: 'الدولة',
      preferredLanguage: 'اللغة المفضلة',
      acceptTerms: 'أوافق على الشروط وسياسة الخصوصية',
      button: 'متابعة'
    },
    goal: {
      title: 'هدفك',
      category: 'الفئة',
      amount: 'المبلغ المقدر',
      photo: 'صورة اختيارية',
      titleField: 'عنوان الهدف',
      description: 'الوصف',
      button: 'المتابعة إلى الدفع',
      categories: { travel: 'السفر', education: 'التعليم', health: 'الصحة', family: 'العائلة', business: 'الأعمال', other: 'أخرى' }
    },
    payment: {
      title: 'رسوم المشاركة',
      subtitle: 'رسوم واحدة بقيمة €10 تفعيل حملتك بعد التأكيد.',
      payNow: 'ادفع €10',
      secure: 'دفع آمن عبر Stripe',
      methods: { card: 'بطاقة', apple: 'Apple Pay', google: 'Google Pay' },
      cardName: 'اسم حامل البطاقة',
      cardNumber: 'رقم البطاقة',
      expiry: 'تاريخ الانتهاء',
      cvc: 'CVC',
      summary: 'ملخص الحملة'
    },
    confirmation: {
      title: 'أنت على وشك الانتهاء!',
      summary: 'ملخص الهدف',
      goal: 'الهدف',
      amount: 'المبلغ',
      status: 'الحالة',
      dashboard: 'الذهاب إلى اللوحة',
      emailSent: 'تم إرسال بريد تأكيد.'
    },
    dashboard: {
      title: 'لوحة التحكم',
      status: 'حالة المشاركة',
      active: 'الهدف نشط',
      draft: 'مسودة',
      paymentHistory: 'سجل المدفوعات',
      fee: 'رسوم المشاركة'
    },
    admin: {
      title: 'لوحة الإدارة',
      total: 'إجمالي الأموال',
      export: 'تصدير CSV',
      list: 'قائمة المراجعة',
      approve: 'موافقة',
      reject: 'رفض'
    }
  }
} as const;

const defaultUser: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  country: 'Italy',
  preferredLanguage: 'en',
  acceptedTerms: false,
  verified: false,
};

const defaultGoal: GoalData = {
  title: '',
  description: '',
  category: 'travel',
  amount: 2500,
  photo: '',
  status: 'draft',
};

const defaultPayment: PaymentData = {
  method: 'card',
  amount: 10,
  paid: false,
  reference: '',
  date: '',
};

const initialRows: GoalRow[] = [
  { id: 1, user: 'Sara Rossi', country: 'Italy', language: 'it', category: 'travel', raised: 1800, status: 'approved' },
  { id: 2, user: 'Ana García', country: 'Spain', language: 'es', category: 'education', raised: 2600, status: 'review' },
  { id: 3, user: 'Julie Martin', country: 'France', language: 'fr', category: 'family', raised: 1200, status: 'approved' },
  { id: 4, user: 'Mina Ali', country: 'UAE', language: 'ar', category: 'health', raised: 4500, status: 'review' },
];

const detectLanguage = (): AppLanguage => {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  return LANGUAGES.includes(locale as AppLanguage) ? (locale as AppLanguage) : 'en';
};

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(detectLanguage);
  const [screen, setScreen] = useState<ScreenName>('landing');
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [goal, setGoal] = useState<GoalData>(defaultGoal);
  const [payment, setPayment] = useState<PaymentData>(defaultPayment);
  const [rows, setRows] = useState<GoalRow[]>(initialRows);
  const [emailSent, setEmailSent] = useState(false);

  const t = useMemo(() => translations[language], [language]);

  const renderScreen = () => {
    switch (screen) {
      case 'landing':
        return <LandingScreen t={t} onContinue={() => setScreen('signup')} />;
      case 'signup':
        return <SignupScreen t={t} user={user} setUser={setUser} onContinue={() => setScreen('goal')} onBack={() => setScreen('landing')} />;
      case 'goal':
        return <GoalScreen t={t} goal={goal} setGoal={setGoal} onContinue={() => setScreen('payment')} onBack={() => setScreen('signup')} />;
      case 'payment':
        return <PaymentScreen t={t} user={user} goal={goal} payment={payment} setPayment={setPayment} onPay={() => { setPayment((current) => ({ ...current, paid: true, reference: `GF-${Date.now().toString().slice(-8)}`, date: new Date().toISOString() })); setEmailSent(true); setScreen('confirmation'); }} onBack={() => setScreen('goal')} />;
      case 'confirmation':
        return <ConfirmationScreen t={t} goal={goal} payment={payment} emailSent={emailSent} onContinue={() => setScreen('dashboard')} />;
      case 'dashboard':
        return <DashboardScreen t={t} user={user} goal={goal} payment={payment} onAdmin={() => setScreen('admin')} />;
      case 'admin':
        return <AdminScreen t={t} rows={rows} setRows={setRows} onBack={() => setScreen('dashboard')} />;
      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fffaf6" />
      <View style={styles.shell}>
        <View style={styles.topbar}>
          <Text style={styles.brand}>GoalFund</Text>
          <View style={styles.topbarRight}>
            <TouchableOpacity onPress={() => setScreen('dashboard')}>
              <Text style={styles.link}>{t.nav.dashboard}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen('admin')}>
              <Text style={styles.link}>{t.nav.admin}</Text>
            </TouchableOpacity>
            <View style={styles.langBox}>
              <Text style={styles.langLabel}>{t.nav.language}</Text>
              <View style={styles.languageRow}>
                {LANGUAGES.map((item) => (
                  <TouchableOpacity key={item} onPress={() => setLanguage(item)} style={[styles.langChip, language === item && styles.langChipActive]}>
                    <Text style={[styles.langText, language === item && styles.langTextActive]}>{item.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>{renderScreen()}</ScrollView>
      </View>
    </>
  );
}

function LandingScreen({ t, onContinue }: { t: any; onContinue: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.cardHero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{t.landing.eyebrow}</Text>
          <Text style={styles.heroTitle}>{t.landing.title}</Text>
          <Text style={styles.subtitle}>{t.landing.subtitle}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
            <Text style={styles.primaryText}>{t.landing.cta}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroVisual}>
          <View style={styles.visualCard}>
            <Text style={styles.visualBadge}>+€2.4k</Text>
            <View style={styles.progressBar}><View style={styles.progressBarFill}/></View>
            <Text style={styles.visualMeta}>4.2k supporters</Text>
            <Text style={styles.visualMeta}>12 days left</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.landing.howItWorks}</Text>
          {t.landing.steps.map((step: string, index: number) => (
            <View key={index} style={styles.stepRow}>
              <Text style={styles.stepIndex}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, styles.softCard]}>
          <Text style={styles.sectionTitle}>{t.landing.trust}</Text>
          <Text style={styles.statText}>{t.landing.steps[0]}</Text>
          <Text style={styles.statText}>2.4k goals funded</Text>
          <Text style={styles.statText}>19k supporters</Text>
          <Text style={styles.statText}>€3,200 average support</Text>
        </View>
      </View>
    </View>
  );
}

function SignupScreen({ t, user, setUser, onContinue, onBack }: { t: any; user: UserProfile; setUser: React.Dispatch<React.SetStateAction<UserProfile>>; onContinue: () => void; onBack: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.cardForm}>
        <Text style={styles.formTitle}>{t.signup.title}</Text>
        <Text style={styles.subtitle}>{t.signup.subtitle}</Text>

        <TextInput style={styles.input} placeholder={t.signup.firstName} value={user.firstName} onChangeText={(text) => setUser((current) => ({ ...current, firstName: text }))} />
        <TextInput style={styles.input} placeholder={t.signup.lastName} value={user.lastName} onChangeText={(text) => setUser((current) => ({ ...current, lastName: text }))} />
        <TextInput style={styles.input} placeholder={t.signup.email} keyboardType="email-address" value={user.email} onChangeText={(text) => setUser((current) => ({ ...current, email: text }))} />
        <TextInput style={styles.input} placeholder={t.signup.password} secureTextEntry value={user.password} onChangeText={(text) => setUser((current) => ({ ...current, password: text }))} />
        <TextInput style={styles.input} placeholder={t.signup.country} value={user.country} onChangeText={(text) => setUser((current) => ({ ...current, country: text }))} />

        <Text style={styles.label}>{t.signup.preferredLanguage}</Text>
        <View style={styles.chipsRow}>
          {LANGUAGES.map((item) => (
            <TouchableOpacity key={item} onPress={() => setUser((current) => ({ ...current, preferredLanguage: item }))} style={[styles.choiceChip, user.preferredLanguage === item && styles.choiceChipActive]}>
              <Text style={[styles.choiceText, user.preferredLanguage === item && styles.choiceTextActive]}>{item.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setUser((current) => ({ ...current, acceptedTerms: !current.acceptedTerms }))}>
          <View style={[styles.checkbox, user.acceptedTerms && styles.checkboxActive]} />
          <Text style={styles.checkboxLabel}>{t.signup.acceptTerms}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
          <Text style={styles.primaryText}>{t.signup.button}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GoalScreen({ t, goal, setGoal, onContinue, onBack }: { t: any; goal: GoalData; setGoal: React.Dispatch<React.SetStateAction<GoalData>>; onContinue: () => void; onBack: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.cardForm}>
        <Text style={styles.formTitle}>{t.goal.title}</Text>
        <TextInput style={styles.input} placeholder={t.goal.titleField} value={goal.title} onChangeText={(text) => setGoal((current) => ({ ...current, title: text }))} maxLength={80} />
        <TextInput style={styles.textArea} placeholder={t.goal.description} multiline value={goal.description} onChangeText={(text) => setGoal((current) => ({ ...current, description: text }))} maxLength={2000} />

        <Text style={styles.label}>{t.goal.category}</Text>
        <View style={styles.chipsRowWrap}>
          {Object.entries(t.goal.categories).map(([key, label]) => (
            <TouchableOpacity key={key} onPress={() => setGoal((current) => ({ ...current, category: key as GoalData['category'] }))} style={[styles.choiceChip, goal.category === key && styles.choiceChipActive]}>
              <Text style={[styles.choiceText, goal.category === key && styles.choiceTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder={t.goal.amount} keyboardType="numeric" value={String(goal.amount)} onChangeText={(text) => setGoal((current) => ({ ...current, amount: Number(text || 0) }))} />
        <TextInput style={styles.input} placeholder={t.goal.photo} value={goal.photo} onChangeText={(text) => setGoal((current) => ({ ...current, photo: text }))} />

        <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
          <Text style={styles.primaryText}>{t.goal.button}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PaymentScreen({ t, user, goal, payment, setPayment, onPay, onBack }: { t: any; user: UserProfile; goal: GoalData; payment: PaymentData; setPayment: React.Dispatch<React.SetStateAction<PaymentData>>; onPay: () => void; onBack: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.cardForm}>
        <Text style={styles.formTitle}>{t.payment.title}</Text>
        <Text style={styles.subtitle}>{t.payment.subtitle}</Text>

        <View style={styles.paymentRow}>
          {(['card', 'apple', 'google'] as const).map((method) => (
            <TouchableOpacity key={method} onPress={() => setPayment((current) => ({ ...current, method }))} style={[styles.methodChip, payment.method === method && styles.methodChipActive]}>
              <Text style={[styles.choiceText, payment.method === method && styles.choiceTextActive]}>{t.payment.methods[method]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{t.payment.summary}</Text>
          <Text style={styles.summaryLine}>{goal.title || 'Dream goal'}: {currency(goal.amount)}</Text>
          <Text style={styles.summaryLine}>{user.firstName || 'Supporter'}: {t.payment.payNow}</Text>
        </View>

        <TextInput style={styles.input} value={`${user.firstName} ${user.lastName}`.trim()} editable={false} />
        <TextInput style={styles.input} value="4242 4242 4242 4242" editable={false} />
        <View style={styles.inlineFields}>
          <TextInput style={[styles.input, styles.inlineInput]} value="12/28" editable={false} />
          <TextInput style={[styles.input, styles.inlineInput]} value="123" editable={false} />
        </View>

        <Text style={styles.secureText}>{t.payment.secure}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={onPay}>
          <Text style={styles.primaryText}>{t.payment.payNow}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ConfirmationScreen({ t, goal, payment, emailSent, onContinue }: { t: any; goal: GoalData; payment: PaymentData; emailSent: boolean; onContinue: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.cardForm}>
        <Text style={styles.successBadge}>✓</Text>
        <Text style={styles.formTitle}>{t.confirmation.title}</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{t.confirmation.summary}</Text>
          <Text style={styles.summaryLine}>{t.confirmation.goal}: {goal.title}</Text>
          <Text style={styles.summaryLine}>{t.confirmation.amount}: {currency(goal.amount)}</Text>
          <Text style={styles.summaryLine}>{t.confirmation.status}: {payment.paid ? 'Paid' : 'Pending'}</Text>
        </View>

        {emailSent && <Text style={styles.successText}>{t.confirmation.emailSent}</Text>}

        <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
          <Text style={styles.primaryText}>{t.confirmation.dashboard}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DashboardScreen({ t, user, goal, payment, onAdmin }: { t: any; user: UserProfile; goal: GoalData; payment: PaymentData; onAdmin: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.cardForm}>
        <Text style={styles.formTitle}>{t.dashboard.title}</Text>
        <Text style={styles.subtitle}>Hi {user.firstName || 'GoalFund user'}</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{t.dashboard.status}</Text>
          <Text style={styles.summaryLine}>{goal.title || 'My goal'}</Text>
          <Text style={styles.summaryLine}>{payment.paid ? t.dashboard.active : t.dashboard.draft}</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{t.dashboard.paymentHistory}</Text>
          {payment.paid ? (
            <Text style={styles.summaryLine}>{t.dashboard.fee}: {currency(payment.amount)}</Text>
          ) : (
            <Text style={styles.summaryLine}>No payments yet</Text>
          )}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onAdmin}>
          <Text style={styles.primaryText}>{t.nav.admin}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AdminScreen({ t, rows, setRows, onBack }: { t: any; rows: GoalRow[]; setRows: React.Dispatch<React.SetStateAction<GoalRow[]>>; onBack: () => void }) {
  const totalRaised = rows.reduce((sum, row) => sum + row.raised, 0);
  return (
    <View style={styles.page}>
      <View style={styles.cardForm}>
        <Text style={styles.formTitle}>{t.admin.title}</Text>
        <Text style={styles.subtitle}>{t.admin.total}: {currency(totalRaised)}</Text>

        {rows.map((row) => (
          <View key={row.id} style={styles.rowAdmin}>
            <Text style={styles.adminName}>{row.user}</Text>
            <Text style={styles.adminMeta}>{row.country} · {row.language.toUpperCase()}</Text>
            <Text style={styles.adminMeta}>{currency(row.raised)} · {row.status}</Text>
            <View style={styles.inlineActions}>
              <TouchableOpacity style={styles.approveChip} onPress={() => setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: 'approved' } : item))}>
                <Text style={styles.approveText}>{t.admin.approve}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectChip} onPress={() => setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: 'rejected' } : item))}>
                <Text style={styles.rejectText}>{t.admin.reject}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#fffaf6',
  },
  content: {
    paddingBottom: 32,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,250,246,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f5e3d7',
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1d2b38',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  link: {
    color: '#1d2b38',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  langBox: {
    paddingHorizontal: 4,
  },
  langLabel: {
    fontSize: 12,
    color: '#536879',
    marginBottom: 4,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  langChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0e1d7',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  langChipActive: {
    backgroundColor: '#fbe5d8',
    borderColor: '#ff8d5c',
  },
  langText: {
    fontSize: 10,
    color: '#536879',
  },
  langTextActive: {
    color: '#f26e42',
    fontWeight: '700',
  },
  page: {
    padding: 16,
  },
  cardHero: {
    backgroundColor: '#fffefb',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f5d9c7',
    flexDirection: 'column',
    gap: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f5d9c7',
    marginBottom: 16,
  },
  softCard: {
    backgroundColor: '#fffaf6',
  },
  cardForm: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f5d9c7',
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#f26e42',
    fontWeight: '800',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1d2b38',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1d2b38',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#536879',
    lineHeight: 22,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#ff8d5c',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#f26e42',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#cfe7df',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: '#edf9f5',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryText: {
    color: '#1d2b38',
    fontWeight: '700',
  },
  heroVisual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#fff4ee',
    padding: 18,
    minHeight: 220,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#ffd9c2',
  },
  visualBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    fontWeight: '800',
    color: '#f26e42',
    backgroundColor: '#fff',
    marginBottom: 40,
  },
  progressBar: {
    height: 14,
    backgroundColor: '#eee4dd',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '72%',
    height: '100%',
    backgroundColor: '#39b39b',
  },
  visualMeta: {
    color: '#536879',
    fontSize: 14,
    marginTop: 14,
  },
  infoGrid: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1d2b38',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepIndex: {
    width: 28,
    height: 28,
    backgroundColor: '#ff8d5c',
    borderRadius: 999,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800',
    marginRight: 12,
  },
  stepText: {
    color: '#536879',
    flex: 1,
    lineHeight: 22,
  },
  statText: {
    fontSize: 15,
    color: '#1d2b38',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0e1d7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#1d2b38',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0e1d7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    minHeight: 110,
    textAlignVertical: 'top',
    color: '#1d2b38',
  },
  label: {
    color: '#1d2b38',
    fontWeight: '700',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  chipsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  choiceChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0e1d7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  choiceChipActive: {
    backgroundColor: '#fbe5d8',
    borderColor: '#ff8d5c',
  },
  choiceText: {
    color: '#536879',
    fontSize: 12,
    fontWeight: '700',
  },
  choiceTextActive: {
    color: '#f26e42',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d7dfe8',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#39b39b',
    borderColor: '#39b39b',
  },
  checkboxLabel: {
    color: '#1d2b38',
    flex: 1,
    lineHeight: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  methodChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0e1d7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodChipActive: {
    backgroundColor: '#fbe5d8',
    borderColor: '#ff8d5c',
  },
  summaryBox: {
    backgroundColor: '#fff4ee',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f5d9c7',
    padding: 14,
    marginBottom: 12,
  },
  summaryTitle: {
    color: '#1d2b38',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
  },
  summaryLine: {
    color: '#536879',
    fontSize: 14,
    lineHeight: 22,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineInput: {
    flex: 1,
  },
  secureText: {
    textAlign: 'center',
    color: '#2d9c7c',
    fontWeight: '700',
    marginVertical: 12,
  },
  successBadge: {
    fontSize: 42,
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: 8,
  },
  successText: {
    color: '#27ae60',
    textAlign: 'center',
    fontWeight: '700',
    marginVertical: 8,
  },
  rowAdmin: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f5d9c7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  adminName: {
    color: '#1d2b38',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  adminMeta: {
    color: '#536879',
    marginBottom: 6,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  approveChip: {
    backgroundColor: 'rgba(39,174,96,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rejectChip: {
    backgroundColor: 'rgba(216,93,93,0.10)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  approveText: {
    color: '#27ae60',
    fontWeight: '700',
  },
  rejectText: {
    color: '#d85d5d',
    fontWeight: '700',
  },
});
