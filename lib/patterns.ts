import type { SecretSeverity } from "@/lib/types";

export interface SecretPattern {
  id: string;
  name: string;
  description: string;
  severity: SecretSeverity;
  category: string;
  regex: RegExp;
}

export const SECRET_PATTERNS: SecretPattern[] = [
  {
    id: "aws_access_key",
    name: "AWS Access Key ID",
    description: "Static AWS IAM access key ID",
    severity: "critical",
    category: "cloud",
    regex: /\bAKIA[0-9A-Z]{16}\b/g
  },
  {
    id: "aws_secret_key",
    name: "AWS Secret Access Key",
    description: "AWS IAM secret access key assignment",
    severity: "critical",
    category: "cloud",
    regex: /(?:aws|amazon)?[_\-\s]*(?:secret|sec)[_\-\s]*access[_\-\s]*key\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi
  },
  {
    id: "aws_session_token",
    name: "AWS Session Token",
    description: "Temporary AWS session credential",
    severity: "high",
    category: "cloud",
    regex: /(?:aws[_\-\s]*session[_\-\s]*token)\s*[:=]\s*['"]?([A-Za-z0-9/+=]{60,})['"]?/gi
  },
  {
    id: "stripe_live_secret",
    name: "Stripe Live Secret Key",
    description: "Stripe live server-side key",
    severity: "critical",
    category: "payments",
    regex: /\bsk_live_[0-9A-Za-z]{16,}\b/g
  },
  {
    id: "stripe_restricted",
    name: "Stripe Restricted Key",
    description: "Stripe restricted API key",
    severity: "high",
    category: "payments",
    regex: /\brk_live_[0-9A-Za-z]{16,}\b/g
  },
  {
    id: "stripe_webhook",
    name: "Stripe Webhook Secret",
    description: "Stripe signing secret for webhook validation",
    severity: "high",
    category: "payments",
    regex: /\bwhsec_[0-9A-Za-z]{16,}\b/g
  },
  {
    id: "openai_key",
    name: "OpenAI API Key",
    description: "OpenAI API key",
    severity: "critical",
    category: "ai",
    regex: /\bsk-[A-Za-z0-9]{20,}\b/g
  },
  {
    id: "anthropic_key",
    name: "Anthropic API Key",
    description: "Anthropic API key",
    severity: "critical",
    category: "ai",
    regex: /\bsk-ant-[A-Za-z0-9\-_]{16,}\b/g
  },
  {
    id: "huggingface_token",
    name: "Hugging Face Token",
    description: "Hugging Face access token",
    severity: "high",
    category: "ai",
    regex: /\bhf_[A-Za-z0-9]{30,}\b/g
  },
  {
    id: "openrouter_key",
    name: "OpenRouter Key",
    description: "OpenRouter API key",
    severity: "high",
    category: "ai",
    regex: /\bsk-or-v1-[A-Za-z0-9]{16,}\b/g
  },
  {
    id: "github_pat",
    name: "GitHub Personal Access Token",
    description: "GitHub fine-grained or classic token",
    severity: "critical",
    category: "developer",
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}\b/g
  },
  {
    id: "github_fine_grained",
    name: "GitHub Fine-Grained PAT",
    description: "New GitHub token format",
    severity: "critical",
    category: "developer",
    regex: /\bgithub_pat_[A-Za-z0-9_]{70,255}\b/g
  },
  {
    id: "gitlab_pat",
    name: "GitLab PAT",
    description: "GitLab personal access token",
    severity: "high",
    category: "developer",
    regex: /\bglpat-[A-Za-z0-9\-_]{20,}\b/g
  },
  {
    id: "npm_token",
    name: "NPM Token",
    description: "NPM registry auth token",
    severity: "high",
    category: "developer",
    regex: /\bnpm_[A-Za-z0-9]{36}\b/g
  },
  {
    id: "npm_auth_token",
    name: "NPM Auth Token Assignment",
    description: "NPM auth token entry in config files",
    severity: "high",
    category: "developer",
    regex: /(?:_authToken|\/\/registry\.npmjs\.org\/:_authToken)\s*=\s*([A-Za-z0-9\-_]{20,})/gi
  },
  {
    id: "pypi_token",
    name: "PyPI Token",
    description: "Python package index auth token",
    severity: "high",
    category: "developer",
    regex: /\bpypi-[A-Za-z0-9\-_]{50,}\b/g
  },
  {
    id: "slack_token",
    name: "Slack Token",
    description: "Slack bot/user token",
    severity: "high",
    category: "collaboration",
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,120}\b/g
  },
  {
    id: "slack_webhook",
    name: "Slack Incoming Webhook",
    description: "Slack webhook URL",
    severity: "high",
    category: "collaboration",
    regex: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9\-_\/]{20,}/g
  },
  {
    id: "discord_webhook",
    name: "Discord Webhook",
    description: "Discord webhook URL",
    severity: "high",
    category: "collaboration",
    regex: /https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[A-Za-z0-9\-_]+/g
  },
  {
    id: "discord_token",
    name: "Discord Token",
    description: "Discord user or bot token",
    severity: "high",
    category: "collaboration",
    regex: /\bmfa\.[A-Za-z0-9\-_]{60,}|[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}\b/g
  },
  {
    id: "telegram_bot_token",
    name: "Telegram Bot Token",
    description: "Telegram bot API token",
    severity: "high",
    category: "collaboration",
    regex: /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/g
  },
  {
    id: "twilio_sid",
    name: "Twilio Account SID",
    description: "Twilio account identifier",
    severity: "medium",
    category: "communications",
    regex: /\bAC[a-fA-F0-9]{32}\b/g
  },
  {
    id: "twilio_auth",
    name: "Twilio Auth Token",
    description: "Twilio auth token assignment",
    severity: "high",
    category: "communications",
    regex: /(?:twilio[_\-\s]*auth[_\-\s]*token)\s*[:=]\s*['"]?([a-fA-F0-9]{32})['"]?/gi
  },
  {
    id: "sendgrid_key",
    name: "SendGrid API Key",
    description: "SendGrid API key",
    severity: "high",
    category: "communications",
    regex: /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g
  },
  {
    id: "mailgun_key",
    name: "Mailgun API Key",
    description: "Mailgun private API key",
    severity: "high",
    category: "communications",
    regex: /\bkey-[A-Za-z0-9]{32}\b/g
  },
  {
    id: "mailchimp_key",
    name: "Mailchimp API Key",
    description: "Mailchimp account API key",
    severity: "high",
    category: "communications",
    regex: /\b[0-9a-f]{32}-us\d{1,2}\b/g
  },
  {
    id: "google_api_key",
    name: "Google API Key",
    description: "Google Cloud API key",
    severity: "high",
    category: "cloud",
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g
  },
  {
    id: "gcp_service_account",
    name: "GCP Service Account JSON",
    description: "Google Cloud service account private key material",
    severity: "critical",
    category: "cloud",
    regex: /"type"\s*:\s*"service_account"[\s\S]{0,500}?"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/gi
  },
  {
    id: "firebase_server_key",
    name: "Firebase Server Key",
    description: "Legacy Firebase server key",
    severity: "high",
    category: "cloud",
    regex: /\bAAAA[A-Za-z0-9_-]{6,}:[A-Za-z0-9_-]{100,}\b/g
  },
  {
    id: "azure_storage_conn",
    name: "Azure Storage Connection String",
    description: "Azure storage account secret connection string",
    severity: "critical",
    category: "cloud",
    regex: /DefaultEndpointsProtocol=https;AccountName=[^;\s]+;AccountKey=[^;\s]+;EndpointSuffix=core\.windows\.net/gi
  },
  {
    id: "azure_client_secret",
    name: "Azure Client Secret",
    description: "Azure app registration client secret",
    severity: "high",
    category: "cloud",
    regex: /(?:azure|client)[_\-\s]*secret\s*[:=]\s*['"]?([A-Za-z0-9~._-]{20,})['"]?/gi
  },
  {
    id: "cloudflare_token",
    name: "Cloudflare API Token",
    description: "Cloudflare API token assignment",
    severity: "high",
    category: "cloud",
    regex: /(?:cloudflare|cf)[_\-\s]*(?:api)?[_\-\s]*token\s*[:=]\s*['"]?([A-Za-z0-9_-]{30,})['"]?/gi
  },
  {
    id: "digitalocean_token",
    name: "DigitalOcean PAT",
    description: "DigitalOcean personal access token",
    severity: "high",
    category: "cloud",
    regex: /\bdop_v1_[A-Za-z0-9]{64}\b/g
  },
  {
    id: "shopify_token",
    name: "Shopify Access Token",
    description: "Shopify private app token",
    severity: "high",
    category: "commerce",
    regex: /\bshpat_[a-fA-F0-9]{32}\b/g
  },
  {
    id: "square_token",
    name: "Square Access Token",
    description: "Square access token",
    severity: "high",
    category: "commerce",
    regex: /\bsq0atp-[A-Za-z0-9\-_]{20,}\b/g
  },
  {
    id: "square_secret",
    name: "Square OAuth Secret",
    description: "Square OAuth secret",
    severity: "high",
    category: "commerce",
    regex: /\bsq0csp-[A-Za-z0-9\-_]{20,}\b/g
  },
  {
    id: "paypal_braintree",
    name: "Braintree Access Token",
    description: "Braintree production access token",
    severity: "critical",
    category: "payments",
    regex: /\baccess_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}\b/g
  },
  {
    id: "notion_secret",
    name: "Notion Internal Integration Token",
    description: "Notion secret token",
    severity: "high",
    category: "productivity",
    regex: /\bsecret_[A-Za-z0-9]{40,}\b/g
  },
  {
    id: "linear_api_key",
    name: "Linear API Key",
    description: "Linear personal API key",
    severity: "high",
    category: "productivity",
    regex: /\blin_api_[A-Za-z0-9]{20,}\b/g
  },
  {
    id: "asana_pat",
    name: "Asana PAT",
    description: "Asana personal access token",
    severity: "high",
    category: "productivity",
    regex: /\b0\/[0-9]{16}:[A-Za-z0-9]{32}\b/g
  },
  {
    id: "jwt_token",
    name: "JWT",
    description: "JSON web token that may grant API access",
    severity: "medium",
    category: "auth",
    regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g
  },
  {
    id: "rsa_private_key",
    name: "RSA Private Key",
    description: "PEM-formatted RSA private key",
    severity: "critical",
    category: "keys",
    regex: /-----BEGIN RSA PRIVATE KEY-----/g
  },
  {
    id: "private_key_pem",
    name: "Generic Private Key",
    description: "PEM private key block",
    severity: "critical",
    category: "keys",
    regex: /-----BEGIN PRIVATE KEY-----/g
  },
  {
    id: "ec_private_key",
    name: "EC Private Key",
    description: "Elliptic curve private key",
    severity: "critical",
    category: "keys",
    regex: /-----BEGIN EC PRIVATE KEY-----/g
  },
  {
    id: "openssh_private_key",
    name: "OpenSSH Private Key",
    description: "OpenSSH private key block",
    severity: "critical",
    category: "keys",
    regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g
  },
  {
    id: "pg_connection",
    name: "Postgres Connection String",
    description: "PostgreSQL URI with embedded credentials",
    severity: "high",
    category: "database",
    regex: /\bpostgres(?:ql)?:\/\/[A-Za-z0-9_.%-]+:[^@\s]{6,}@[A-Za-z0-9.-]+(?::\d+)?\/[A-Za-z0-9_-]+\b/gi
  },
  {
    id: "mysql_connection",
    name: "MySQL Connection String",
    description: "MySQL URI with embedded credentials",
    severity: "high",
    category: "database",
    regex: /\bmysql:\/\/[A-Za-z0-9_.%-]+:[^@\s]{6,}@[A-Za-z0-9.-]+(?::\d+)?\/[A-Za-z0-9_-]+\b/gi
  },
  {
    id: "mongodb_connection",
    name: "MongoDB Connection String",
    description: "MongoDB URI with embedded credentials",
    severity: "high",
    category: "database",
    regex: /\bmongodb(?:\+srv)?:\/\/[A-Za-z0-9_.%-]+:[^@\s]{6,}@[A-Za-z0-9.\-/,?=&_%:+]+\b/gi
  },
  {
    id: "redis_connection",
    name: "Redis Connection String",
    description: "Redis URI with embedded credentials",
    severity: "medium",
    category: "database",
    regex: /\bredis:\/\/[A-Za-z0-9_.%-]*:[^@\s]{6,}@[A-Za-z0-9.-]+(?::\d+)?(?:\/\d+)?\b/gi
  },
  {
    id: "supabase_anon_key",
    name: "Supabase Key",
    description: "Supabase anon/service key",
    severity: "high",
    category: "database",
    regex: /\bsb(?:p|s)k_[A-Za-z0-9\-_]{20,}\b/g
  },
  {
    id: "vercel_token",
    name: "Vercel Token",
    description: "Vercel access token assignment",
    severity: "high",
    category: "deployment",
    regex: /(?:vercel[_\-\s]*token|vc[_\-\s]*token)\s*[:=]\s*['"]?([A-Za-z0-9]{20,})['"]?/gi
  },
  {
    id: "netlify_token",
    name: "Netlify Token",
    description: "Netlify personal access token assignment",
    severity: "high",
    category: "deployment",
    regex: /(?:netlify[_\-\s]*(?:auth|access)?[_\-\s]*token)\s*[:=]\s*['"]?([A-Za-z0-9\-_]{20,})['"]?/gi
  },
  {
    id: "render_api_key",
    name: "Render API Key",
    description: "Render API key assignment",
    severity: "high",
    category: "deployment",
    regex: /(?:render[_\-\s]*api[_\-\s]*key)\s*[:=]\s*['"]?([A-Za-z0-9\-_]{20,})['"]?/gi
  },
  {
    id: "docker_auth",
    name: "Docker Auth Blob",
    description: "Encoded Docker registry auth value",
    severity: "medium",
    category: "devops",
    regex: /"auth"\s*:\s*"[A-Za-z0-9+/=]{20,}"/g
  },
  {
    id: "kubernetes_token",
    name: "Kubernetes Bearer Token",
    description: "Kubernetes token in kubeconfig",
    severity: "high",
    category: "devops",
    regex: /(?:kubernetes|k8s)[\s\S]{0,80}?token\s*:\s*['"]?([A-Za-z0-9\-_.]{20,})['"]?/gi
  },
  {
    id: "datadog_api_key",
    name: "Datadog API Key",
    description: "Datadog API key assignment",
    severity: "high",
    category: "monitoring",
    regex: /(?:datadog[_\-\s]*api[_\-\s]*key|dd[_\-\s]*api[_\-\s]*key)\s*[:=]\s*['"]?([a-f0-9]{32})['"]?/gi
  },
  {
    id: "newrelic_license",
    name: "New Relic License Key",
    description: "New Relic ingest license key",
    severity: "high",
    category: "monitoring",
    regex: /(?:new[_\-\s]*relic[_\-\s]*license[_\-\s]*key)\s*[:=]\s*['"]?([A-Za-z0-9]{40})['"]?/gi
  },
  {
    id: "sentry_dsn",
    name: "Sentry DSN",
    description: "Sentry DSN with auth segment",
    severity: "medium",
    category: "monitoring",
    regex: /https:\/\/[a-f0-9]{32}@[A-Za-z0-9.-]+\.ingest\.sentry\.io\/\d+/gi
  },
  {
    id: "algolia_api_key",
    name: "Algolia API Key",
    description: "Algolia API key assignment",
    severity: "medium",
    category: "search",
    regex: /(?:algolia[_\-\s]*api[_\-\s]*key)\s*[:=]\s*['"]?([A-Za-z0-9]{20,})['"]?/gi
  },
  {
    id: "basic_auth_header",
    name: "Basic Authorization Header",
    description: "HTTP basic auth header with encoded credentials",
    severity: "medium",
    category: "auth",
    regex: /Authorization\s*:\s*Basic\s+[A-Za-z0-9+/=]{16,}/gi
  },
  {
    id: "bearer_token_assignment",
    name: "Bearer Token Assignment",
    description: "Assigned bearer token string",
    severity: "medium",
    category: "auth",
    regex: /(?:bearer[_\-\s]*token|access[_\-\s]*token)\s*[:=]\s*['"]?([A-Za-z0-9\-_.]{20,})['"]?/gi
  },
  {
    id: "api_key_assignment",
    name: "Generic API Key Assignment",
    description: "High-entropy api key style assignment",
    severity: "medium",
    category: "generic",
    regex: /(?:api[_\-\s]*key|secret[_\-\s]*key|app[_\-\s]*secret)\s*[:=]\s*['"]?([A-Za-z0-9\-_+/=]{20,})['"]?/gi
  },
  {
    id: "password_assignment",
    name: "Password Assignment",
    description: "Credential assignment containing a non-trivial password",
    severity: "medium",
    category: "generic",
    regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]?([^\s'";]{8,})['"]?/gi
  }
];
