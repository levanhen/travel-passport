import {
  BadgeCriteriaType,
  BadgeStatus,
  DestinationStatus,
  MerchantCategory,
  MerchantStatus,
  OrganizationStatus,
  OrganizationType,
  ParticipationLevel,
  PrismaClient,
  ProofLevel,
  QrMode,
  SiteCategory,
  SiteStatus,
  UserRole,
  VoucherStatus,
} from '@prisma/client';
import { DA_NANG_CATALOG_SITES } from './seed-data/da-nang-catalog';
import { ensureEmailUser, envOr } from './seed-helpers';

const PARTNER_SITES = [
  {
    orgSlug: 'ngu-hanh-son-operator',
    orgName: 'Ban Quản lý Ngũ Hành Sơn',
    siteSlug: 'marble-mountains-partner',
    siteName: 'Ngũ Hành Sơn (Quầy QR)',
    description: 'Check-in quầy với QR xoay tại khu di tích.',
    latitude: 16.0038,
    longitude: 108.264,
    category: SiteCategory.HERITAGE,
    operatorEmail: 'operator@ngu-hanh-son.local',
  },
  {
    orgSlug: 'cham-museum-operator',
    orgName: 'Bảo tàng Điêu khắc Chăm',
    siteSlug: 'cham-museum-partner',
    siteName: 'Bảo tàng Chăm (Quầy QR)',
    description: 'Check-in partner tại quầy vé Bảo tàng Điêu khắc Chăm.',
    latitude: 16.0603,
    longitude: 108.2202,
    category: SiteCategory.HERITAGE,
    operatorEmail: 'operator@cham-museum.local',
  },
  {
    orgSlug: 'dragon-bridge-operator',
    orgName: 'Ban quản lý Cầu Rồng',
    siteSlug: 'dragon-bridge-partner',
    siteName: 'Cầu Rồng (Quầy QR)',
    description: 'Check-in partner tại khu vực quầy thông tin Cầu Rồng.',
    latitude: 16.0614,
    longitude: 108.2275,
    category: SiteCategory.CULTURAL,
    operatorEmail: 'operator@dragon-bridge.local',
  },
] as const;

const MERCHANTS = [
  {
    orgSlug: 'cafe-bach-dang',
    orgName: 'Cafe Bach Dang',
    merchantSlug: 'cafe-bach-dang',
    merchantName: 'Cafe Bạch Đằng',
    category: MerchantCategory.CAFE,
    address: '123 Bạch Đằng, Hải Châu, Đà Nẵng',
    ownerEmail: 'merchant@cafe-bach-dang.local',
    staffEmail: 'staff@cafe-bach-dang.local',
    vouchers: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        title: 'Giảm 15% đồ uống',
        description: 'Áp dụng cho đồ uống tại quán.',
        discountLabel: '15% OFF',
        costPoints: 0,
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        title: 'Cà phê đặc biệt',
        description: 'Đổi 50 điểm lấy 1 ly cà phê.',
        discountLabel: 'FREE COFFEE',
        costPoints: 50,
      },
    ],
  },
  {
    orgSlug: 'nha-hang-my-son',
    orgName: 'Nhà hàng Mỹ Sơn',
    merchantSlug: 'nha-hang-my-son',
    merchantName: 'Nhà hàng Mỹ Sơn',
    category: MerchantCategory.RESTAURANT,
    address: '45 Trần Phú, Hải Châu, Đà Nẵng',
    ownerEmail: 'merchant@my-son-restaurant.local',
    staffEmail: 'staff@my-son-restaurant.local',
    vouchers: [
      {
        id: '00000000-0000-4000-8000-000000000003',
        title: 'Giảm 10% bữa trưa',
        description: 'Áp dụng set lunch.',
        discountLabel: '10% OFF',
        costPoints: 0,
      },
      {
        id: '00000000-0000-4000-8000-000000000004',
        title: 'Món khai vị miễn phí',
        description: 'Đổi 80 điểm.',
        discountLabel: 'FREE APPETIZER',
        costPoints: 80,
      },
    ],
  },
  {
    orgSlug: 'com-nieu-co-dao',
    orgName: 'Cơm Niêu Cô Đao',
    merchantSlug: 'com-nieu-co-dao',
    merchantName: 'Cơm Niêu Cô Đao',
    category: MerchantCategory.RESTAURANT,
    address: '88 Nguyễn Văn Linh, Đà Nẵng',
    ownerEmail: 'merchant@com-nieu.local',
    staffEmail: 'staff@com-nieu.local',
    vouchers: [
      {
        id: '00000000-0000-4000-8000-000000000005',
        title: 'Giảm 20.000đ',
        description: 'Voucher giảm giá trực tiếp.',
        discountLabel: '-20K',
        costPoints: 100,
      },
    ],
  },
] as const;

export async function seedPlatformAdmin(prisma: PrismaClient) {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('Skip platform_admin — set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD');
    return;
  }
  await ensureEmailUser(prisma, {
    email,
    password,
    role: UserRole.platform_admin,
  });
}

export async function seedDaNangPilot(prisma: PrismaClient) {
  const operatorPassword = envOr('SITE_OPERATOR_PASSWORD', '123operator');
  const authorityPassword = envOr('AUTHORITY_ADMIN_PASSWORD', '123authority');
  const merchantPassword = envOr('MERCHANT_OWNER_PASSWORD', '123merchant');
  const staffPassword = envOr('MERCHANT_STAFF_PASSWORD', '123staff');

  await prisma.organization.upsert({
    where: { slug: 'platform' },
    create: {
      name: 'Tourism Passport Platform',
      slug: 'platform',
      type: OrganizationType.PLATFORM,
      status: OrganizationStatus.active,
    },
    update: {},
  });

  const authorityOrg = await prisma.organization.upsert({
    where: { slug: 'da-nang-authority' },
    create: {
      name: 'Sở Du lịch Đà Nẵng',
      slug: 'da-nang-authority',
      type: OrganizationType.AUTHORITY,
      status: OrganizationStatus.active,
    },
    update: { status: OrganizationStatus.active },
  });

  await ensureEmailUser(prisma, {
    email: envOr('AUTHORITY_ADMIN_EMAIL', 'authority@travelpassport.local'),
    password: authorityPassword,
    role: UserRole.authority_admin,
    organizationId: authorityOrg.id,
    membershipRole: UserRole.authority_admin,
  });

  const destination = await prisma.destination.upsert({
    where: { slug: 'da-nang' },
    create: {
      name: 'Đà Nẵng',
      slug: 'da-nang',
      description:
        'Điểm đến pilot Tourism Passport — khám phá biển, di sản và văn hóa thành phố biển miền Trung.',
      status: DestinationStatus.published,
    },
    update: {
      status: DestinationStatus.published,
      description:
        'Điểm đến pilot Tourism Passport — khám phá biển, di sản và văn hóa thành phố biển miền Trung.',
    },
  });

  let catalogCount = 0;
  for (const site of DA_NANG_CATALOG_SITES) {
    await prisma.tourismSite.upsert({
      where: {
        destinationId_slug: { destinationId: destination.id, slug: site.slug },
      },
      create: {
        destinationId: destination.id,
        participationLevel: ParticipationLevel.catalog,
        name: site.name,
        slug: site.slug,
        description: site.description,
        address: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        geofenceRadiusMeters: 80,
        category: site.category,
        status: SiteStatus.published,
        checkInEnabled: true,
        staticQrEnabled: site.staticQrEnabled ?? false,
      },
      update: {
        name: site.name,
        description: site.description,
        address: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        status: SiteStatus.published,
        checkInEnabled: true,
        staticQrEnabled: site.staticQrEnabled ?? false,
      },
    });
    catalogCount++;
  }

  for (const partner of PARTNER_SITES) {
    const operatorOrg = await prisma.organization.upsert({
      where: { slug: partner.orgSlug },
      create: {
        name: partner.orgName,
        slug: partner.orgSlug,
        type: OrganizationType.DESTINATION_OPERATOR,
        status: OrganizationStatus.active,
      },
      update: { status: OrganizationStatus.active },
    });

    await prisma.tourismSite.upsert({
      where: {
        destinationId_slug: { destinationId: destination.id, slug: partner.siteSlug },
      },
      create: {
        destinationId: destination.id,
        organizationId: operatorOrg.id,
        participationLevel: ParticipationLevel.partner,
        name: partner.siteName,
        slug: partner.siteSlug,
        description: partner.description,
        latitude: partner.latitude,
        longitude: partner.longitude,
        geofenceRadiusMeters: 100,
        category: partner.category,
        status: SiteStatus.published,
        checkInEnabled: true,
        qrMode: QrMode.rotating,
      },
      update: {
        status: SiteStatus.published,
        checkInEnabled: true,
        qrMode: QrMode.rotating,
        organizationId: operatorOrg.id,
      },
    });

    await ensureEmailUser(prisma, {
      email: partner.operatorEmail,
      password: operatorPassword,
      role: UserRole.site_operator,
      organizationId: operatorOrg.id,
      membershipRole: UserRole.site_operator,
    });
  }

  console.log(
    `Đà Nẵng pilot: destination=${destination.id}, catalog=${catalogCount}, partner=${PARTNER_SITES.length}`,
  );

  const badges = [
    {
      slug: 'first-step',
      name: 'Bước chân đầu tiên',
      description: 'Hoàn thành check-in đầu tiên tại pilot Đà Nẵng.',
      criteriaType: BadgeCriteriaType.FIRST_CHECKIN,
      criteria: { destinationId: destination.id },
      sortOrder: 1,
    },
    {
      slug: 'da-nang-explorer',
      name: 'Khám phá Đà Nẵng',
      description: 'Check-in tại 5 điểm khác nhau.',
      criteriaType: BadgeCriteriaType.CHECKIN_COUNT,
      criteria: {
        destinationId: destination.id,
        count: 5,
        distinctSites: true,
        minProofLevel: ProofLevel.L0,
      },
      sortOrder: 2,
    },
    {
      slug: 'heritage-explorer',
      name: 'Di sản miền Trung',
      description: 'Check-in 3 điểm di sản.',
      criteriaType: BadgeCriteriaType.CHECKIN_COUNT,
      criteria: {
        destinationId: destination.id,
        siteCategory: SiteCategory.HERITAGE,
        count: 3,
        distinctSites: true,
        minProofLevel: ProofLevel.L0,
      },
      sortOrder: 3,
    },
    {
      slug: 'beach-lover',
      name: 'Yêu biển',
      description: 'Check-in 3 bãi biển.',
      criteriaType: BadgeCriteriaType.CHECKIN_COUNT,
      criteria: {
        destinationId: destination.id,
        siteCategory: SiteCategory.BEACH,
        count: 3,
        distinctSites: true,
        minProofLevel: ProofLevel.L0,
      },
      sortOrder: 4,
    },
    {
      slug: 'verified-traveller',
      name: 'Du khách xác thực',
      description: '5 check-in đạt proof level L2.',
      criteriaType: BadgeCriteriaType.CHECKIN_COUNT,
      criteria: {
        destinationId: destination.id,
        count: 5,
        distinctSites: true,
        minProofLevel: ProofLevel.L2,
      },
      sortOrder: 5,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      create: {
        ...badge,
        destinationId: destination.id,
        issuerOrganizationId: authorityOrg.id,
        status: BadgeStatus.published,
      },
      update: {
        name: badge.name,
        description: badge.description,
        criteria: badge.criteria,
        status: BadgeStatus.published,
        sortOrder: badge.sortOrder,
      },
    });
  }

  // Legacy slugs — giữ published cho DB đã có dữ liệu cũ
  await prisma.badge.upsert({
    where: { slug: 'first-checkin-da-nang' },
    create: {
      slug: 'first-checkin-da-nang',
      name: 'Chuyến đi đầu tiên (legacy)',
      description: 'Alias first-step.',
      destinationId: destination.id,
      issuerOrganizationId: authorityOrg.id,
      criteriaType: BadgeCriteriaType.FIRST_CHECKIN,
      criteria: { destinationId: destination.id },
      status: BadgeStatus.published,
      sortOrder: 10,
    },
    update: { status: BadgeStatus.published },
  });

  console.log('Badges pilot: first-step, da-nang-explorer, heritage-explorer, beach-lover, verified-traveller');

  const validFrom = new Date();
  const validUntil = new Date(validFrom);
  validUntil.setMonth(validUntil.getMonth() + 6);

  for (const m of MERCHANTS) {
    const merchantOrg = await prisma.organization.upsert({
      where: { slug: m.orgSlug },
      create: {
        name: m.orgName,
        slug: m.orgSlug,
        type: OrganizationType.MERCHANT,
        status: OrganizationStatus.active,
      },
      update: { status: OrganizationStatus.active },
    });

    const ownerEmail = m.ownerEmail;
    await ensureEmailUser(prisma, {
      email: ownerEmail,
      password: merchantPassword,
      role: UserRole.merchant_owner,
      organizationId: merchantOrg.id,
      membershipRole: UserRole.merchant_owner,
    });

    await ensureEmailUser(prisma, {
      email: m.staffEmail,
      password: staffPassword,
      role: UserRole.merchant_staff,
      organizationId: merchantOrg.id,
      membershipRole: UserRole.merchant_staff,
    });

    const merchant = await prisma.merchant.upsert({
      where: { organizationId: merchantOrg.id },
      create: {
        organizationId: merchantOrg.id,
        destinationId: destination.id,
        name: m.merchantName,
        slug: m.merchantSlug,
        category: m.category,
        address: m.address,
        status: MerchantStatus.active,
      },
      update: { status: MerchantStatus.active, name: m.merchantName },
    });

    for (const v of m.vouchers) {
      await prisma.voucher.upsert({
        where: { id: v.id },
        create: {
          id: v.id,
          merchantId: merchant.id,
          destinationId: destination.id,
          title: v.title,
          description: v.description,
          discountLabel: v.discountLabel,
          minLevel: 'TRAVELLER',
          minBalance: 0,
          costPoints: v.costPoints,
          quotaTotal: 500,
          validFrom,
          validUntil,
          status: VoucherStatus.issued,
        },
        update: {
          status: VoucherStatus.issued,
          title: v.title,
          costPoints: v.costPoints,
        },
      });
    }

    console.log(`Merchant: ${merchant.name} (${ownerEmail}, staff ${m.staffEmail})`);
  }
}
