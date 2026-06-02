#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# GCP Project ID is automatically detected from your gcloud configuration.
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-southeast1" # As specified in the original script
SERVICE_NAME="intranet-hub"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME"
REQUIRED_FILES=("Dockerfile" "nginx.conf")

# --- Helper Functions ---
info() {
  echo "--------------------------------------------------"
  echo "INFO: $1"
  echo "--------------------------------------------------"
}

# --- Pre-flight Checks ---
info "Starting deployment script..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud command could not be found. Please install and configure the Google Cloud SDK."
    exit 1
fi

# Check if a project is set
if [ -z "$PROJECT_ID" ]; then
    echo "ERROR: No active Google Cloud project found. Please set one using 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

info "Project ID: $PROJECT_ID"
info "Region:     $REGION"
info "Service:    $SERVICE_NAME"

for REQUIRED_FILE in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$REQUIRED_FILE" ]; then
    echo "ERROR: Missing required file at repo root: $REQUIRED_FILE"
    exit 1
  fi
done

# --- Build and Deploy ---
info "Building and pushing container image..."
gcloud builds submit . --tag "$IMAGE_TAG"

info "Deploying '$SERVICE_NAME' to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_TAG" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

info "Deployment script finished successfully!"
info "Listing deployed service:"
gcloud run services list --region "$REGION" --filter "metadata.name=$SERVICE_NAME"
