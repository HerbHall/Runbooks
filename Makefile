IMAGE ?= herbhall/runbooks
TAG ?= latest

BUILDER = buildx-multi-arch

STATIC_FLAGS = CGO_ENABLED=0
LDFLAGS = -s -w

INFO_COLOR = \033[0;36m
NO_COLOR   = \033[m

build-extension: ## Build the extension image
	docker build --tag=$(IMAGE):$(TAG) .

install-extension: build-extension ## Install the extension
	docker extension install $(IMAGE):$(TAG)

update-extension: build-extension ## Update the extension
	docker extension update $(IMAGE):$(TAG)

remove-extension: ## Remove the extension
	docker extension rm $(IMAGE):$(TAG)

prepare-buildx: ## Create buildx builder for multi-arch build
	docker buildx inspect $(BUILDER) || docker buildx create --name=$(BUILDER) --driver=docker-container --driver-opt=network=host

push-extension: prepare-buildx ## Build and push multi-arch extension image
	docker buildx build --push --builder=$(BUILDER) --platform=linux/amd64,linux/arm64 --build-arg TAG=$(TAG) --tag=$(IMAGE):$(TAG) .

validate-extension: ## Validate the extension
	docker extension validate $(IMAGE):$(TAG)

dev-ui: ## Start UI hot reload for development
	cd ui && npm start

dev-attach: ## Attach local UI source to running extension
	docker extension dev ui-source $(IMAGE):$(TAG) http://localhost:3000

dev-reset: ## Reset extension development
	docker extension dev reset $(IMAGE):$(TAG)

help: ## Show this help
	@echo Please specify a build target. The choices are:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(INFO_COLOR)%-30s$(NO_COLOR) %s\n", $$1, $$2}'

.PHONY: help
