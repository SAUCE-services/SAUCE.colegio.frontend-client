# SauceColegio Documentation Pipeline
#
# Usage:
#   make docs          - Generate all documentation assets
#   make docs-diagrams - Generate PNG images from Mermaid diagram sources
#   make docs-clean    - Remove generated documentation assets

MERMAID_DIR := docs/diagrams
OUTPUT_DIR  := docs/generated
MMDC        := npx -y @mermaid-js/mermaid-cli

.PHONY: docs docs-diagrams docs-clean

docs: docs-diagrams
	@echo "Documentation generated successfully."
	@echo "  - Diagrams: $(OUTPUT_DIR)/"

docs-diagrams: | $(OUTPUT_DIR)
	@echo "Generating diagrams from $(MERMAID_DIR)..."
	@for mmd in $(MERMAID_DIR)/*.mmd; do \
		name=$$(basename "$$mmd" .mmd); \
		echo "  -> $$name"; \
		$(MMDC) -i "$$mmd" -o "$(OUTPUT_DIR)/$$name.png" --puppeteerConfigFile puppeteer.json 2>/dev/null || \
		echo "  [SKIP] Install @mermaid-js/mermaid-cli for automatic PNG generation"; \
	done

$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

docs-clean:
	rm -rf $(OUTPUT_DIR)
	@echo "Cleaned generated documentation."
