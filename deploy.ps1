# --- Configuration ---
# GCP Project ID is automatically detected from your gcloud configuration.
$ErrorActionPreference = "Stop"

# --- Helper Functions ---
function Write-Info {
    param([string]$Message)
    Write-Host "--------------------------------------------------"
    Write-Host "INFO: $Message"
    Write-Host "--------------------------------------------------"
}

# --- Pre-flight Checks ---
Write-Info "Starting deployment script..."

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud command could not be found. Please install and configure the Google Cloud SDK."
    exit 1
}

# Get Project ID
$PROJECT_ID = gcloud config get-value project
if (-not $PROJECT_ID) {
    Write-Error "No active Google Cloud project found. Please set one using 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
}

$REGION = "asia-southeast1" # As specified in the original script
$SERVICE_NAME = "intranet-hub"
$IMAGE_TAG = "gcr.io/$PROJECT_ID/$SERVICE_NAME"
$REQUIRED_FILES = @("Dockerfile", "nginx.conf")

Write-Info "Project ID: $PROJECT_ID"
Write-Info "Region:     $REGION"
Write-Info "Service:    $SERVICE_NAME"

foreach ($RequiredFile in $REQUIRED_FILES) {
    if (-not (Test-Path -Path $RequiredFile -PathType Leaf)) {
        Write-Error "Missing required file at repo root: $RequiredFile"
        exit 1
    }
}

# --- Build and Deploy ---
Write-Info "Building and pushing container image..."
gcloud builds submit . --tag $IMAGE_TAG
if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Build failed (exit $LASTEXITCODE). Aborting before deploy so the previous image isn't silently re-rolled."
    exit $LASTEXITCODE
}

Write-Info "Deploying '$SERVICE_NAME' to Cloud Run..."
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_TAG `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10

Write-Info "Deployment script finished successfully!"
Write-Info "Listing deployed service:"
gcloud run services list --region $REGION --filter "metadata.name=$SERVICE_NAME"
