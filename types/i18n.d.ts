export type Dictionary = {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    sort: string;
    actions: string;
    close: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    reset: string;
    refresh: string;
    download: string;
    upload: string;
    select: string;
    selectAll: string;
    unselectAll: string;
    yes: string;
    no: string;
    or: string;
    and: string;
    of: string;
    noData: string;
    noResults: string;
    viewAll: string;
    viewLess: string;
    more: string;
    less: string;
    new: string;
    all: string;
    none: string;
    today: string;
    yesterday: string;
    week: string;
    month: string;
    year: string;
    date: string;
    time: string;
    status: string;
    active: string;
    inactive: string;
    pending: string;
    completed: string;
    failed: string;
    never: string;
    skipToContent: string;
    mainContent: string;
    loadingMore: string;
    loadedMore: string;
    endOfList: string;
    infiniteTable: string;
    retry: string;
    copy: string;
    copied: string;
    share: string;
    export: string;
    import: string;
    settings: string;
    help: string;
    documentation: string;
    support: string;
    feedback: string;
    report: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    system: string;
  };
  admin: {
    cron: {
      title: string;
      subtitle: string;
      scheduledJobs: string;
      runNow: string;
      table: {
        jobName: string;
        schedule: string;
        lastRun: string;
        status: string;
        duration: string;
      };
      migration: {
        title: string;
        stepsTitle: string;
        step1: string;
        step2: string;
        step3: string;
        scheduleTitle: string;
        schedule1: string;
        schedule2: string;
        schedule3: string;
        schedule4: string;
      };
    };
  };
  nav: {
    home: string;
    demo: string;
    pricing: string;
    support: string;
    lab: string;
    login: string;
    freeTrial: string;
    profile: string;
    settings: string;
    team: string;
    analytics: string;
    help: string;
    logout: string;
    dashboard: string;
    campaigns: string;
    reports: string;
  };
  brand: {
    name: string;
  };
  auth: {
    login: {
      title: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      submit: string;
      forgotPassword: string;
      noAccount: string;
      signUp: string;
      or: string;
      continueWith: string;
      errors: {
        invalidEmail: string;
        passwordRequired: string;
        invalidCredentials: string;
        general: string;
        tooManyAttempts: string;
      };
      success: string;
    };
    signup: {
      title: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      submit: string;
      hasAccount: string;
      login: string;
      agreeToTerms: string;
      termsOfService: string;
      privacyPolicy: string;
      and: string;
      errors: {
        invalidEmail: string;
        passwordMin: string;
        passwordMatch: string;
        general: string;
        emailExists: string;
      };
      success: string;
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      email: string;
      emailPlaceholder: string;
      submit: string;
      backToLogin: string;
      errors: {
        invalidEmail: string;
        general: string;
        sessionExpired: string;
      };
      success: string;
    };
    resetPassword: {
      title: string;
      subtitle: string;
      newPassword: string;
      newPasswordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      submit: string;
      checkingSession: string;
      invalidSession: string;
      errors: {
        passwordMin: string;
        passwordMatch: string;
        general: string;
        invalidToken: string;
      };
      success: string;
    };
    codeError: {
      title: string;
      description: string;
      reasonsTitle: string;
      reasons: {
        expired: string;
        used: string;
        invalid: string;
      };
      solutionTitle: string;
      actions: {
        resetPassword: string;
        backToLogin: string;
      };
      footerHelp: string;
    };
  };
  dashboard: {
    title: string;
    subtitle: string;
    noData: string;
    loginRequired: string;
    tabs: {
      campaigns: string;
      platforms: string;
      team: string;
      aria: string;
    };
    overview: {
      totalCampaigns: string;
      activeCampaigns: string;
      connectedPlatforms: string;
      totalBudget: string;
    };
    sync: {
      button: string;
      syncing: string;
      noConnections: string;
      connectFirst: string;
      success: string;
      successDescription: string;
      error: string;
      errorDescription: string;
      syncAll: string;
      noActivePlatforms: string;
      syncPlatforms: string;
    };
    metrics: {
      totalSpend: string;
      totalImpressions: string;
      totalClicks: string;
      avgCTR: string;
      avgCPC: string;
      totalConversions: string;
    };
    charts: {
      performance: string;
      platforms: string;
      campaigns: string;
    };
    filters: {
      dateRange: string;
      platform: string;
      campaign: string;
      status: string;
    };
  };
  profile: {
    title: string;
    notFound: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailReadonly: string;
    uploadPrompt: string;
    toast: {
      avatarUpdated: string;
      avatarUpdateError: string;
      avatarDeleted: string;
      avatarDeleteError: string;
    };
  };
  campaigns: {
    title: string;
    subtitle: string;
    table: {
      name: string;
      platform: string;
      status: string;
      budget: string;
      spent: string;
      impressions: string;
      clicks: string;
      ctr: string;
      cpc: string;
      conversions: string;
      lastUpdated: string;
      metrics: string;
      actions: string;
      impressionsLabel: string;
      clicksLabel: string;
      noCampaigns: string;
    };
    actions: {
      enable: string;
      disable: string;
      edit: string;
      delete: string;
      duplicate: string;
      viewDetails: string;
    };
    status: {
      active: string;
      paused: string;
      completed: string;
      draft: string;
      error: string;
    };
    filters: {
      all: string;
      active: string;
      paused: string;
      completed: string;
    };
    budgetModal: {
      title: string;
      campaign: string;
      currentBudget: string;
      newBudgetLabel: string;
      newBudgetPlaceholder: string;
      cancel: string;
      update: string;
    };
    statusModal: {
      title: string;
      confirmActive: string;
      activate: string;
      deactivate: string;
      confirmSuffix: string;
      cancel: string;
      confirm: string;
    };
    search: {
      placeholder: string;
    };
    toast: {
      invalidBudget: string;
      budgetUpdateSuccess: string;
      budgetUpdateError: string;
      statusChangeSuccess: string;
      statusChangeError: string;
    };
    metrics: {
      totalBudgetLabel: string;
      totalSpendLabel: string;
      totalImpressionsLabel: string;
      totalClicksLabel: string;
      won: string;
    };
    actionLabels: {
      editBudget: string;
      activate: string;
      deactivate: string;
    };
  };
  integrations: {
    title: string;
    subtitle: string;
    connected: string;
    connect: string;
    disconnect: string;
    reconnect: string;
    platforms: {
      googleAds: {
        name: string;
        description: string;
        features: string;
        feature1: string;
        feature2: string;
        feature3: string;
        feature4: string;
        connectButton: string;
        instructions: string;
      };
      metaAds: {
        name: string;
        description: string;
      };
      naverAds: {
        name: string;
        description: string;
      };
      kakaoAds: {
        name: string;
        description: string;
      };
      coupangAds: {
        name: string;
        description: string;
      };
    };
    test: {
      googleOAuth: {
        title: string;
        connectionDetails: string;
      };
    };
    connectedAccount: string;
    lastSync: string;
    syncNow: string;
    settings: string;
    errors: {
      connectionFailed: string;
      authExpired: string;
      syncFailed: string;
      oauthCancelled: string;
      invalidOauthResponse: string;
      teamNotFound: string;
      oauthFailed: string;
    };
    success: {
      connected: string;
      disconnected: string;
    };
    management: {
      title: string;
      subtitle: string;
      refreshAll: string;
      refresh: string;
      tokenRefreshService: string;
      tokenRefreshDescription: string;
      serviceStatus: string;
      running: string;
      stopped: string;
      totalIntegrations: string;
      needRefresh: string;
      connectedPlatforms: string;
      lastSyncTime: string;
      tokenExpiry: string;
      disconnect: string;
      platformIntegration: string;
      oauthSupported: string;
      manualOnly: string;
      connected: string;
      comingSoon: string;
      disconnectModal: {
        title: string;
        confirmText: string;
        platformName: string;
        warning: string;
        cancel: string;
        disconnect: string;
      };
    };
    status: {
      error: string;
      needsRefresh: string;
      connected: string;
      inactive: string;
    };
    credentials: {
      title: string;
      modalTitle: string;
      notConnected: string;
      oauthInfo: string;
      oauthSupported: string;
      apiKey: string;
      secretKey: string;
      accessKey: string;
      customerId: string;
      naverApiKeyPlaceholder: string;
      customerIdPlaceholder: string;
      coupangAccessKeyPlaceholder: string;
      coupangSecretKeyPlaceholder: string;
      connectedDate: string;
      googleDescription: string;
      budgetManagement: string;
      accountName: string;
      accountId: string;
      accountList: string;
      noAccounts: string;
      platformAccountManagement: string;
      accountsConnected: string;
      addAccount: string;
      addAccountTitle: string;
      noName: string;
      tokenExpired: string;
      checking: string;
      notSynced: string;
      tokenRefreshSuccess: string;
      tokenRefreshSuccessDesc: string;
      reAuthFailed: string;
      reAuthFailedDesc: string;
    };
  };
  pricing: {
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    save: string;
    mostPopular: string;
    plans: {
      starter: {
        name: string;
        price: string;
        description: string;
        features: string[];
      };
      professional: {
        name: string;
        price: string;
        description: string;
        features: string[];
      };
      enterprise: {
        name: string;
        price: string;
        description: string;
        features: string[];
      };
    };
    cta: {
      startFreeTrial: string;
      contactSales: string;
      currentPlan: string;
    };
    header: {
      title: {
        pre: string;
        highlight: string;
        post: string;
      };
      subtitle: string;
    };
    badges: {
      mostPopular: string;
    };
    footer: {
      note: string;
    };
  };
  home: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
      subCta: string;
    };
    features: {
      title: string;
      subtitle: string;
      unifiedDashboard: {
        title: string;
        description: string;
      };
      automaticOptimization: {
        title: string;
        description: string;
      };
      secureDataManagement: {
        title: string;
        description: string;
      };
      flexibleIntegration: {
        title: string;
        description: string;
      };
      dashboard: {
        title: string;
        description: string;
      };
      automation: {
        title: string;
        description: string;
      };
      security: {
        title: string;
        description: string;
      };
      integration: {
        title: string;
        description: string;
      };
    };
    platforms: {
      title: string;
      subtitle: string;
      visualization: {
        title: string;
        subtitle: string;
      };
    };
    dashboard: {
      title: string;
      subtitle: string;
    };
    cta: {
      mainTitle: string;
      mainTitleHighlight: string;
      mainSubtitle: string;
      primaryButton: string;
      secondaryButton: string;
      sectionTitle: string;
      sectionSubtitle: string;
      sectionButton: string;
    };
  };
  contact: {
    page: {
      title: string;
      subtitle: string;
    };
    form: {
      title: string;
      nameLabel: string;
      namePlaceholder: string;
      companyLabel: string;
      companyPlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      submit: string;
    };
  };
  settings: {
    title: string;
    sections: {
      notifications: {
        title: string;
        subtitle: string;
        email: {
          title: string;
          description: string;
        };
        browser: {
          title: string;
          description: string;
        };
      };
      security: {
        title: string;
        subtitle: string;
        twoFactor: {
          title: string;
          description: string;
        };
        loginAlerts: {
          title: string;
          description: string;
        };
      };
      privacy: {
        title: string;
        subtitle: string;
        dataCollection: {
          title: string;
          description: string;
        };
        marketing: {
          title: string;
          description: string;
        };
      };
    };
  };
  team: {
    title: string;
    subtitle: string;
    invite: {
      title: string;
      email: string;
      role: string;
      sendInvite: string;
      accept: {
        title: string;
        invitedBy: string;
        asRole: string;
        needAccount: string;
        decline: string;
        acceptInvitation: string;
        createAccount: string;
        success: {
          title: string;
          description: string;
        };
        toast: {
          successTitle: string;
          successDescription: string;
          errorTitle: string;
          errorDescription: string;
        };
      };
    };
    members: {
      title: string;
      you: string;
      owner: string;
      admin: string;
      member: string;
      viewer: string;
      pending: string;
      active: string;
    };
    roles: {
      master: {
        name: string;
        description: string;
      };
      team_mate: {
        name: string;
        description: string;
      };
      viewer: {
        name: string;
        description: string;
      };
    };
    actions: {
      changeRole: string;
      remove: string;
      resendInvite: string;
      cancelInvite: string;
    };
    table: {
      columns: {
        member: string;
        email: string;
        role: string;
        joinDate: string;
        actions: string;
        invitedEmail: string;
        status: string;
        invitedBy: string;
        expiresAt: string;
      };
    };
    inviteModal: {
      title: string;
      emailLabel: string;
      emailPlaceholder: string;
      roleLabel: string;
      cancel: string;
      send: string;
    };
    toast: {
      inviteSuccess: string;
      inviteSuccessDescription: string;
      inviteFailed: string;
      inviteFailedDescription: string;
      roleChangeSuccess: string;
      roleChangeSuccessDescription: string;
      roleChangeFailed: string;
      roleChangeFailedDescription: string;
      removeConfirm: string;
      removeSuccess: string;
      removeSuccessDescription: string;
      removeFailed: string;
      removeFailedDescription: string;
    };
    noName: string;
    me: string;
    unknown: string;
    loadingTeam: string;
    teamInfo: string;
    teamName: string;
    myRole: string;
    memberListTitle: string;
    memberListSubtitle: string;
    inviteButton: string;
    noMembers: string;
    invitationListTitle: string;
    invitationListSubtitle: string;
    noInvitations: string;
  };
  footer: {
    product: string;
    features: string;
    integrations: string;
    pricing: string;
    resources: string;
    blog: string;
    guides: string;
    apiDocs: string;
    company: string;
    about: string;
    careers: string;
    partners: string;
    contact: string;
    legal: string;
    terms: string;
    privacy: string;
    refund: string;
    cookies: string;
    security: string;
    newsletter: {
      title: string;
      subtitle: string;
      placeholder: string;
      subscribe: string;
    };
    companyInfo: {
      name: string;
      tagline: string;
      copyright: string;
      address: string;
      email: string;
      phone: string;
    };
  };
  faq: {
    title: string;
    questions: {
      platforms: {
        question: string;
        answer: string;
      };
      migration: {
        question: string;
        answer: string;
      };
      contract: {
        question: string;
        answer: string;
      };
      security: {
        question: string;
        answer: string;
      };
      integration: {
        question: string;
        answer: string;
      };
    };
  };
  errors: {
    general: string;
    network: string;
    unauthorized: string;
    forbidden: string;
    forbiddenRole: string;
    notFound: string;
    serverError: string;
    validation: string;
    somethingWentWrong: string;
  };
  success: {
    saved: string;
    updated: string;
    deleted: string;
    copied: string;
    sent: string;
  };
  analytics: {
    totalImpressions: string;
    totalClicks: string;
    totalCost: string;
    totalConversions: string;
    roas: string;
    impressions: string;
    clicks: string;
    cost: string;
    conversions: string;
    revenue: string;
    metricsTitle: string;
    charts: {
      monthlyTrend: string;
      byChannel: string;
      budgetShare: string;
    };
    ctr: string;
    cpc: string;
    roi: string;
    ui: {
      selectMetric: string;
      animation: string;
      dataLabels: string;
      platformComparisonTitle: string;
      lastUpdated: string;
      vsPreviousPeriod: string;
      noInsights: string;
      detailedMetrics: string;
      tabs: {
        overview: string;
        trends: string;
        breakdown: string;
        insights: string;
      };
      multiplierSuffix: string;
    };
  };
  consent: {
    title: string;
    description: string;
    selectAll: string;
    required: string;
    requestedPermissions: string;
    noticeTitle: string;
    bullets: {
      revokeAnytime: string;
      scopeOnly: string;
      encrypted: string;
      privacy: string;
    };
    buttons: {
      connectSelected: string;
      selectPrompt: string;
    };
    legal: {
      agreePrefix: string;
      agreeSuffix: string;
    };
    platforms: {
      google_ads: {
        name: string;
        permissions: string[];
      };
      meta_ads: {
        name: string;
        permissions: string[];
      };
      tiktok_ads: {
        name: string;
        permissions: string[];
      };
    };
  };
  campaignMetricsModal: {
    title: string;
    noData: string;
    summaryTitle: string;
    impressions: string;
    clicks: string;
    cost: string;
    conversions: string;
    ctr: string;
    cpc: string;
    roas: string;
    dailyPerformanceTitle: string;
    impressionsUnit: string;
    clicksUnit: string;
    closeButton: string;
  };
  adsPerformanceDashboard: {
    title: string;
    subtitle: string;
    realtimeUpdate: string;
    filter: string;
    export: string;
    settings: string;
    refresh: string;
    updating: string;
    lastUpdate: string;
    realtime: string;
    filtersAndOptions: string;
    period: string;
    account: string;
    groupBy: string;
    chartType: string;
    byPlatform: string;
    byAccount: string;
    byCampaign: string;
    byDate: string;
    barChart: string;
    lineChart: string;
    areaChart: string;
    pieChart: string;
    notifications: string;
    unacknowledged: string;
    acknowledge: string;
    totalSpend: string;
    totalImpressions: string;
    totalConversions: string;
    averageRoas: string;
    excellent: string;
    good: string;
    needsImprovement: string;
    overview: string;
    byPlatformTab: string;
    trendAnalysis: string;
    performanceAnalysis: string;
    errorOccurred: string;
    retry: string;
    platformSelect: string;
    loadingPlatformData: string;
    trendAnalysisTitle: string;
    trendAnalysisSubtitle: string;
    performanceAnalysisTitle: string;
    performanceAnalysisSubtitle: string;
    exportData: string;
    exportFormat: string;
    csv: string;
    excel: string;
    json: string;
    pdf: string;
    dataToInclude: string;
    summaryData: string;
    detailedData: string;
    chartImages: string;
    cancel: string;
    dashboardSettings: string;
    autoRefresh: string;
    refreshInterval: string;
    theme: string;
    light: string;
    dark: string;
    auto: string;
    save: string;
  };
  demo: {
    title: string;
    subtitle: string;
    summary: {
      totalSpend: string;
      totalRevenue: string;
      roas: string;
    };
    platforms: {
      title: string;
      spend: string;
      revenue: string;
    };
    cta: {
      message: string;
      tryAllFeatures: string;
    };
  };
  invite: {
    logoutWithCorrectEmail: string;
    alreadyUsed: {
      title: string;
      sentToPrefix: string;
      acceptedSuffix: string;
      loggedInAsPrefix: string;
      instructions: string;
      statusPrefix: string;
    };
    expired: {
      title: string;
      message: string;
    };
    accountExists: {
      title: string;
      prefix: string;
      suffix: string;
      description: string;
    };
    actions: {
      login: string;
      resetPassword: string;
    };
    mismatch: {
      title: string;
      sentToPrefix: string;
      loggedInAsPrefix: string;
      optionsTitle: string;
      option1Title: string;
      option1Desc: string;
      option2Title: string;
      option2Desc: string;
      warning: string;
    };
    unknownTeam: string;
    someone: string;
  };
  support: {
    title: string;
    subtitle: string;
    cards: {
      docs: {
        title: string;
        description: string;
        linkText: string;
      };
      faq: {
        title: string;
        description: string;
        linkText: string;
      };
      email: {
        title: string;
        description: string;
        linkText: string;
      };
      phone: {
        title: string;
        description: string;
        linkText: string;
      };
    };
    enterprise: {
      title: string;
      description: string;
      cta: string;
    };
  };
};
