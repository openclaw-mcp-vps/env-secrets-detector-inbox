import type { SecretPatternDefinition } from "@/lib/types";

export const SECRET_PATTERNS: SecretPatternDefinition[] = [
  {
    id: "aws_access_key",
    name: "AWS Access Key ID",
    description: "Long-lived AWS access key identifier.",
    severity: "critical",
    regex: /\b(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|ASIA|ANPA|ANVA|ASCA)[A-Z0-9]{16}\b/g,
    redactionLabel: "AWS_ACCESS_KEY"
  },
  {
    id: "aws_secret_key",
    name: "AWS Secret Access Key",
    description: "40-character AWS secret value usually paired with an access key ID.",
    severity: "critical",
    regex: /(?:(?:aws|amazon)[\w\s-]{0,20})?(?:secret|access)[\w\s-]{0,10}(?:key)?[\s:="']+([A-Za-z0-9\/+=]{40})/gi,
    redactionLabel: "AWS_SECRET_KEY"
  },
  {
    id: "google_api_key",
    name: "Google API Key",
    description: "Google API key beginning with AIza.",
    severity: "high",
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    redactionLabel: "GOOGLE_API_KEY"
  },
  {
    id: "google_oauth_secret",
    name: "Google OAuth Client Secret",
    description: "Google OAuth client secret with GOCSPX prefix.",
    severity: "critical",
    regex: /\bGOCSPX-[0-9A-Za-z\-_]{28,}\b/g,
    redactionLabel: "GOOGLE_OAUTH_SECRET"
  },
  {
    id: "google_service_account_private_key",
    name: "Google Service Account Private Key",
    description: "PEM private key embedded in service account credentials.",
    severity: "critical",
    regex: /-----BEGIN PRIVATE KEY-----[\s\S]{120,}-----END PRIVATE KEY-----/g,
    redactionLabel: "PRIVATE_KEY_BLOCK"
  },
  {
    id: "stripe_live_secret",
    name: "Stripe Live Secret Key",
    description: "Stripe live API secret key.",
    severity: "critical",
    regex: /\bsk_live_[0-9a-zA-Z]{20,}\b/g,
    redactionLabel: "STRIPE_LIVE_SECRET"
  },
  {
    id: "stripe_test_secret",
    name: "Stripe Test Secret Key",
    description: "Stripe test API secret key.",
    severity: "high",
    regex: /\bsk_test_[0-9a-zA-Z]{20,}\b/g,
    redactionLabel: "STRIPE_TEST_SECRET"
  },
  {
    id: "stripe_restricted_key",
    name: "Stripe Restricted Key",
    description: "Stripe restricted API key.",
    severity: "high",
    regex: /\brk_(?:live|test)_[0-9a-zA-Z]{20,}\b/g,
    redactionLabel: "STRIPE_RESTRICTED_KEY"
  },
  {
    id: "github_pat",
    name: "GitHub Personal Access Token",
    description: "Classic GitHub personal access token.",
    severity: "critical",
    regex: /\bghp_[0-9A-Za-z]{36}\b/g,
    redactionLabel: "GITHUB_PAT"
  },
  {
    id: "github_fine_grained_pat",
    name: "GitHub Fine-Grained Token",
    description: "Fine-grained GitHub token with github_pat_ prefix.",
    severity: "critical",
    regex: /\bgithub_pat_[0-9A-Za-z_]{80,}\b/g,
    redactionLabel: "GITHUB_FINE_GRAINED_TOKEN"
  },
  {
    id: "github_app_token",
    name: "GitHub App Token",
    description: "GitHub app installation token.",
    severity: "high",
    regex: /\bghs_[0-9A-Za-z]{36,}\b/g,
    redactionLabel: "GITHUB_APP_TOKEN"
  },
  {
    id: "github_refresh_token",
    name: "GitHub Refresh Token",
    description: "GitHub OAuth refresh token.",
    severity: "high",
    regex: /\bghr_[0-9A-Za-z]{36,}\b/g,
    redactionLabel: "GITHUB_REFRESH_TOKEN"
  },
  {
    id: "gitlab_pat",
    name: "GitLab Personal Access Token",
    description: "GitLab personal access token.",
    severity: "high",
    regex: /\bglpat-[0-9A-Za-z\-_]{20,}\b/g,
    redactionLabel: "GITLAB_PAT"
  },
  {
    id: "slack_token",
    name: "Slack Token",
    description: "Slack user/bot token beginning with xox.",
    severity: "critical",
    regex: /\bxox(?:a|b|p|r|s)-[0-9A-Za-z-]{10,}\b/g,
    redactionLabel: "SLACK_TOKEN"
  },
  {
    id: "slack_webhook",
    name: "Slack Webhook URL",
    description: "Incoming Slack webhook URL.",
    severity: "high",
    regex: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9\/_-]+/g,
    redactionLabel: "SLACK_WEBHOOK"
  },
  {
    id: "discord_webhook",
    name: "Discord Webhook URL",
    description: "Discord webhook endpoint.",
    severity: "high",
    regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/[0-9A-Za-z\/_-]+/g,
    redactionLabel: "DISCORD_WEBHOOK"
  },
  {
    id: "discord_bot_token",
    name: "Discord Bot Token",
    description: "Discord bot token format.",
    severity: "critical",
    regex: /\b[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27}\b/g,
    redactionLabel: "DISCORD_BOT_TOKEN"
  },
  {
    id: "twilio_sid",
    name: "Twilio Account SID",
    description: "Twilio account SID beginning with AC.",
    severity: "high",
    regex: /\bAC[a-f0-9]{32}\b/gi,
    redactionLabel: "TWILIO_SID"
  },
  {
    id: "twilio_auth_token",
    name: "Twilio Auth Token",
    description: "Twilio auth token value.",
    severity: "critical",
    regex: /(?:twilio[\w\s-]{0,12})?(?:auth|token)[\w\s-]{0,5}[:=\s"']+([a-f0-9]{32})\b/gi,
    redactionLabel: "TWILIO_AUTH_TOKEN"
  },
  {
    id: "sendgrid_key",
    name: "SendGrid API Key",
    description: "SendGrid API key with SG prefix.",
    severity: "critical",
    regex: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g,
    redactionLabel: "SENDGRID_KEY"
  },
  {
    id: "mailgun_key",
    name: "Mailgun API Key",
    description: "Mailgun API key.",
    severity: "high",
    regex: /\bkey-[0-9a-f]{32}\b/gi,
    redactionLabel: "MAILGUN_KEY"
  },
  {
    id: "firebase_server_key",
    name: "Firebase Cloud Messaging Key",
    description: "Legacy Firebase server key.",
    severity: "high",
    regex: /\bAAAA[A-Za-z0-9_-]{20,}:[A-Za-z0-9_-]{130,}\b/g,
    redactionLabel: "FIREBASE_SERVER_KEY"
  },
  {
    id: "openai_key",
    name: "OpenAI API Key",
    description: "OpenAI API key format.",
    severity: "critical",
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    redactionLabel: "OPENAI_KEY"
  },
  {
    id: "anthropic_key",
    name: "Anthropic API Key",
    description: "Anthropic API key format.",
    severity: "critical",
    regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    redactionLabel: "ANTHROPIC_KEY"
  },
  {
    id: "huggingface_token",
    name: "HuggingFace Token",
    description: "HuggingFace user access token.",
    severity: "high",
    regex: /\bhf_[A-Za-z0-9]{30,}\b/g,
    redactionLabel: "HUGGINGFACE_TOKEN"
  },
  {
    id: "npm_token",
    name: "NPM Token",
    description: "NPM automation or publish token.",
    severity: "high",
    regex: /\bnpm_[A-Za-z0-9]{36}\b/g,
    redactionLabel: "NPM_TOKEN"
  },
  {
    id: "pypi_token",
    name: "PyPI Token",
    description: "PyPI API token.",
    severity: "high",
    regex: /\bpypi-[A-Za-z0-9_-]{70,}\b/g,
    redactionLabel: "PYPI_TOKEN"
  },
  {
    id: "docker_pat",
    name: "Docker Personal Access Token",
    description: "Docker access token format.",
    severity: "high",
    regex: /\bdckr_pat_[A-Za-z0-9_-]{20,}\b/g,
    redactionLabel: "DOCKER_PAT"
  },
  {
    id: "digitalocean_token",
    name: "DigitalOcean Token",
    description: "DigitalOcean API token.",
    severity: "high",
    regex: /\bdop_v1_[a-f0-9]{64}\b/gi,
    redactionLabel: "DIGITALOCEAN_TOKEN"
  },
  {
    id: "shopify_access_token",
    name: "Shopify Access Token",
    description: "Shopify access token in custom app integrations.",
    severity: "critical",
    regex: /\bshpat_[a-f0-9]{32}\b/gi,
    redactionLabel: "SHOPIFY_ACCESS_TOKEN"
  },
  {
    id: "square_token",
    name: "Square Access Token",
    description: "Square API access token.",
    severity: "high",
    regex: /\bsq0atp-[0-9A-Za-z_-]{22,}\b/g,
    redactionLabel: "SQUARE_TOKEN"
  },
  {
    id: "telegram_bot_token",
    name: "Telegram Bot Token",
    description: "Telegram bot token.",
    severity: "high",
    regex: /\b[0-9]{8,10}:[A-Za-z0-9_-]{35}\b/g,
    redactionLabel: "TELEGRAM_BOT_TOKEN"
  },
  {
    id: "airtable_key",
    name: "Airtable API Key",
    description: "Legacy Airtable API key.",
    severity: "high",
    regex: /\bkey[A-Za-z0-9]{14}\b/g,
    redactionLabel: "AIRTABLE_KEY"
  },
  {
    id: "asana_token",
    name: "Asana Personal Access Token",
    description: "Asana token format.",
    severity: "high",
    regex: /\b0\/[0-9a-z]{32}\b/g,
    redactionLabel: "ASANA_PAT"
  },
  {
    id: "atlassian_api_token",
    name: "Atlassian API Token",
    description: "Atlassian API token appearing near keyword context.",
    severity: "medium",
    regex: /atlassian[\w\s-]{0,20}(?:token|api key)[\w\s-]{0,8}[:=\s"']+([A-Za-z0-9]{20,40})/gi,
    redactionLabel: "ATLASSIAN_API_TOKEN"
  },
  {
    id: "notion_token",
    name: "Notion Integration Token",
    description: "Notion internal integration secret.",
    severity: "high",
    regex: /\bsecret_[A-Za-z0-9]{43}\b/g,
    redactionLabel: "NOTION_SECRET"
  },
  {
    id: "dropbox_access_token",
    name: "Dropbox Access Token",
    description: "Dropbox short-lived/long-lived access token.",
    severity: "high",
    regex: /\bsl\.[A-Za-z0-9_-]{80,}\b/g,
    redactionLabel: "DROPBOX_TOKEN"
  },
  {
    id: "algolia_admin_key",
    name: "Algolia Admin Key",
    description: "Potential Algolia API key in admin contexts.",
    severity: "high",
    regex: /algolia[\w\s-]{0,20}(?:admin|api)[\w\s-]{0,10}(?:key)?[:=\s"']+([A-Za-z0-9]{32})\b/gi,
    redactionLabel: "ALGOLIA_ADMIN_KEY"
  },
  {
    id: "cloudflare_api_token",
    name: "Cloudflare API Token",
    description: "Cloudflare API token-like value in Cloudflare context.",
    severity: "high",
    regex: /cloudflare[\w\s-]{0,20}(?:token|api key)[\w\s-]{0,10}[:=\s"']+([A-Za-z0-9_-]{30,50})\b/gi,
    redactionLabel: "CLOUDFLARE_TOKEN"
  },
  {
    id: "heroku_api_key",
    name: "Heroku API Key",
    description: "Heroku API key value.",
    severity: "high",
    regex: /heroku[\w\s-]{0,20}(?:api|auth)[\w\s-]{0,10}(?:key|token)?[:=\s"']+([0-9a-f]{32})\b/gi,
    redactionLabel: "HEROKU_API_KEY"
  },
  {
    id: "jwt_token",
    name: "JWT Token",
    description: "Bearer-style JSON web token.",
    severity: "medium",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    redactionLabel: "JWT_TOKEN"
  },
  {
    id: "bearer_token",
    name: "Bearer Token",
    description: "Generic bearer token in authorization context.",
    severity: "high",
    regex: /(?:authorization|bearer)[\s:"'=]{1,5}(?:bearer\s+)?([A-Za-z0-9._-]{20,})/gi,
    redactionLabel: "BEARER_TOKEN"
  },
  {
    id: "basic_auth_in_url",
    name: "Credentials in URL",
    description: "Username/password embedded in a URL.",
    severity: "critical",
    regex: /https?:\/\/[^\s:@/]{2,}:[^\s@/]{4,}@[^\s]+/gi,
    redactionLabel: "URL_WITH_CREDENTIALS"
  },
  {
    id: "postgres_connection_uri",
    name: "PostgreSQL Connection URI",
    description: "Postgres connection string containing credentials.",
    severity: "critical",
    regex: /\bpostgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@[^\s]+/gi,
    redactionLabel: "POSTGRES_URI"
  },
  {
    id: "mysql_connection_uri",
    name: "MySQL Connection URI",
    description: "MySQL connection string containing credentials.",
    severity: "critical",
    regex: /\bmysql:\/\/[^\s:@/]+:[^\s@/]+@[^\s]+/gi,
    redactionLabel: "MYSQL_URI"
  },
  {
    id: "mongodb_connection_uri",
    name: "MongoDB Connection URI",
    description: "MongoDB URI containing credentials.",
    severity: "critical",
    regex: /\bmongodb(?:\+srv)?:\/\/[^\s:@/]+:[^\s@/]+@[^\s]+/gi,
    redactionLabel: "MONGODB_URI"
  },
  {
    id: "redis_connection_uri",
    name: "Redis Connection URI",
    description: "Redis URI containing password information.",
    severity: "high",
    regex: /\bredis(?:s)?:\/\/(?::[^\s@/]+@)?[^\s]+/gi,
    redactionLabel: "REDIS_URI"
  },
  {
    id: "rsa_private_key",
    name: "RSA Private Key",
    description: "RSA private key PEM block.",
    severity: "critical",
    regex: /-----BEGIN RSA PRIVATE KEY-----[\s\S]{120,}-----END RSA PRIVATE KEY-----/g,
    redactionLabel: "RSA_PRIVATE_KEY"
  },
  {
    id: "ec_private_key",
    name: "EC Private Key",
    description: "Elliptic curve private key PEM block.",
    severity: "critical",
    regex: /-----BEGIN EC PRIVATE KEY-----[\s\S]{120,}-----END EC PRIVATE KEY-----/g,
    redactionLabel: "EC_PRIVATE_KEY"
  },
  {
    id: "openssh_private_key",
    name: "OpenSSH Private Key",
    description: "OpenSSH private key block.",
    severity: "critical",
    regex: /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]{120,}-----END OPENSSH PRIVATE KEY-----/g,
    redactionLabel: "OPENSSH_PRIVATE_KEY"
  },
  {
    id: "pgp_private_key",
    name: "PGP Private Key",
    description: "PGP private key block.",
    severity: "critical",
    regex: /-----BEGIN PGP PRIVATE KEY BLOCK-----[\s\S]{120,}-----END PGP PRIVATE KEY BLOCK-----/g,
    redactionLabel: "PGP_PRIVATE_KEY"
  },
  {
    id: "azure_storage_key",
    name: "Azure Storage Account Key",
    description: "Base64-style Azure storage account key near context.",
    severity: "high",
    regex: /(?:azure|storage)[\w\s-]{0,20}(?:key|secret)[\w\s-]{0,10}[:=\s"']+([A-Za-z0-9+\/]{86,88}={0,2})/gi,
    redactionLabel: "AZURE_STORAGE_KEY"
  },
  {
    id: "paypal_access_token",
    name: "PayPal Access Token",
    description: "PayPal OAuth access token style.",
    severity: "high",
    regex: /\bA21AA[0-9A-Za-z\-_]{30,}\b/g,
    redactionLabel: "PAYPAL_ACCESS_TOKEN"
  },
  {
    id: "private_key_generic",
    name: "Generic Private Key Block",
    description: "Generic PEM private key block.",
    severity: "critical",
    regex: /-----BEGIN (?:ENCRYPTED )?PRIVATE KEY-----[\s\S]{120,}-----END (?:ENCRYPTED )?PRIVATE KEY-----/g,
    redactionLabel: "PRIVATE_KEY"
  },
  {
    id: "api_key_assignment",
    name: "Generic API Key Assignment",
    description: "API key assignment in config-style key/value text.",
    severity: "high",
    regex: /(?:api[_-]?key|access[_-]?token|secret[_-]?key|client[_-]?secret)\s*[:=]\s*["']([A-Za-z0-9_\-\/.+=]{16,})["']/gi,
    redactionLabel: "GENERIC_API_KEY"
  },
  {
    id: "password_assignment",
    name: "Password Assignment",
    description: "Password-like value assigned in plain text.",
    severity: "high",
    regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"'\n]{8,})["']/gi,
    redactionLabel: "PASSWORD_VALUE"
  },
  {
    id: "private_key_env",
    name: "Private Key Environment Variable",
    description: "Private key material in an env-style variable.",
    severity: "critical",
    regex: /(?:PRIVATE_KEY|SECRET_KEY|SIGNING_KEY)\s*=\s*['"]?[A-Za-z0-9+\/=_-]{40,}['"]?/gi,
    redactionLabel: "PRIVATE_ENV_KEY"
  },
  {
    id: "connection_string",
    name: "Credentialed Connection String",
    description: "Connection string with explicit user/password parameters.",
    severity: "high",
    regex: /(?:connection|string|dsn)[\w\s-]{0,10}[:=\s"']+[^\n]*(?:user|uid)=\S+[^\n]*(?:password|pwd)=\S+/gi,
    redactionLabel: "CONNECTION_STRING"
  }
];

export const PATTERN_COUNT = SECRET_PATTERNS.length;
