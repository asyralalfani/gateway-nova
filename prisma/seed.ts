import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("▶ Seeding database…");

  const devops = await db.category.upsert({
    where: { name: "DevOps" },
    update: {},
    create: {
      name: "DevOps",
      description: "Build, deploy, dan CI/CD",
      color: "#0ea5e9",
      order: 1,
    },
  });

  const monitoring = await db.category.upsert({
    where: { name: "Monitoring" },
    update: {},
    create: {
      name: "Monitoring",
      description: "Observabilitas dan alerting",
      color: "#f97316",
      order: 2,
    },
  });

  const docs = await db.category.upsert({
    where: { name: "Documentation" },
    update: {},
    create: {
      name: "Documentation",
      description: "Wiki dan referensi internal",
      color: "#10b981",
      order: 3,
    },
  });

  const tagInternal = await db.tag.upsert({
    where: { name: "internal" },
    update: {},
    create: { name: "internal" },
  });
  const tagProduction = await db.tag.upsert({
    where: { name: "production" },
    update: {},
    create: { name: "production" },
  });
  const tagStaging = await db.tag.upsert({
    where: { name: "staging" },
    update: {},
    create: { name: "staging" },
  });

  const samples: {
    name: string;
    url: string;
    description: string;
    iconUrl?: string;
    categoryId: string;
    tagIds: string[];
  }[] = [
    {
      name: "Jenkins",
      url: "https://jenkins.example.internal",
      description: "Pipeline CI/CD utama tim",
      iconUrl: "https://www.jenkins.io/images/logos/jenkins/jenkins.svg",
      categoryId: devops.id,
      tagIds: [tagInternal.id, tagProduction.id],
    },
    {
      name: "GitLab",
      url: "https://gitlab.example.internal",
      description: "Source code repository & merge requests",
      iconUrl: "https://about.gitlab.com/images/press/logo/svg/gitlab-icon-rgb.svg",
      categoryId: devops.id,
      tagIds: [tagInternal.id],
    },
    {
      name: "Argo CD",
      url: "https://argocd.example.internal",
      description: "GitOps deployment ke Kubernetes",
      iconUrl: "https://argo-cd.readthedocs.io/en/stable/assets/logo.png",
      categoryId: devops.id,
      tagIds: [tagInternal.id, tagStaging.id],
    },
    {
      name: "Grafana",
      url: "https://grafana.example.internal",
      description: "Dashboard metrics, logs, dan tracing",
      iconUrl: "https://grafana.com/static/img/menu/grafana2.svg",
      categoryId: monitoring.id,
      tagIds: [tagProduction.id],
    },
    {
      name: "Prometheus",
      url: "https://prometheus.example.internal",
      description: "Metrics & time series database",
      iconUrl: "https://prometheus.io/assets/prometheus_logo_grey.svg",
      categoryId: monitoring.id,
      tagIds: [tagInternal.id],
    },
    {
      name: "Sentry",
      url: "https://sentry.example.internal",
      description: "Error tracking & performance",
      iconUrl: "https://sentry-brand.storage.googleapis.com/sentry-glyph-black.svg",
      categoryId: monitoring.id,
      tagIds: [tagProduction.id],
    },
    {
      name: "Confluence",
      url: "https://confluence.example.internal",
      description: "Knowledge base & meeting notes",
      categoryId: docs.id,
      tagIds: [tagInternal.id],
    },
    {
      name: "API Docs",
      url: "https://docs.example.internal/api",
      description: "Referensi REST API internal",
      categoryId: docs.id,
      tagIds: [tagInternal.id],
    },
  ];

  for (const [i, sample] of samples.entries()) {
    const existing = await db.tool.findFirst({ where: { name: sample.name } });
    if (existing) continue;

    await db.tool.create({
      data: {
        name: sample.name,
        url: sample.url,
        description: sample.description,
        iconUrl: sample.iconUrl,
        order: i,
        categoryId: sample.categoryId,
        tags: { create: sample.tagIds.map((tagId) => ({ tagId })) },
      },
    });
  }

  // Admin user untuk kalau AUTH_ENABLED=true diaktifkan.
  // Password awal: admin (ubah segera setelah login pertama).
  const existingAdmin = await db.user.findUnique({ where: { username: "admin" } });
  if (!existingAdmin) {
    await db.user.create({
      data: {
        username: "admin",
        passwordHash: await bcrypt.hash("admin", 12),
        role: "ADMIN",
      },
    });
    console.log("  ✓ User admin dibuat (password: admin) — ganti setelah login");
  }

  console.log("✓ Seed selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
