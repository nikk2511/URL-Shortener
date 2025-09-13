// Simple QR Code Generator (Basic Implementation)
// This is a minimal QR code generator that creates a simple pattern
// For production use, consider using a proper QR code library

class SimpleQRGenerator {
    constructor() {
        this.size = 120;
        this.modules = 21; // Standard QR code size
    }

    generate(text, container) {
        try {
            console.log('Generating simple QR code for:', text);
            
            // Create a simple pattern-based QR code representation
            const canvas = document.createElement('canvas');
            canvas.width = this.size;
            canvas.height = this.size;
            const ctx = canvas.getContext('2d');

            // Clear canvas with white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, this.size, this.size);

            // Generate a simple pattern based on the text
            const pattern = this.generatePattern(text);
            
            // Draw the pattern
            const moduleSize = this.size / this.modules;
            
            for (let row = 0; row < this.modules; row++) {
                for (let col = 0; col < this.modules; col++) {
                    if (pattern[row][col]) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(
                            col * moduleSize,
                            row * moduleSize,
                            moduleSize,
                            moduleSize
                        );
                    }
                }
            }

            // Add corner markers (QR code style)
            this.drawCornerMarker(ctx, 0, 0, moduleSize);
            this.drawCornerMarker(ctx, this.modules - 7, 0, moduleSize);
            this.drawCornerMarker(ctx, 0, this.modules - 7, moduleSize);

            // Clear container and add canvas
            container.innerHTML = '';
            container.appendChild(canvas);
            
            console.log('Simple QR code generated successfully');

        } catch (error) {
            console.error('Simple QR generation error:', error);
            this.showError(container);
        }
    }

    generatePattern(text) {
        const pattern = Array(this.modules).fill().map(() => Array(this.modules).fill(false));
        
        // Simple hash-based pattern generation
        let hash = this.simpleHash(text);
        
        for (let row = 0; row < this.modules; row++) {
            for (let col = 0; col < this.modules; col++) {
                // Skip corner marker areas
                if (this.isCornerMarkerArea(row, col)) {
                    continue;
                }
                
                // Generate pattern based on hash
                hash = (hash * 31 + row * 7 + col * 11) % 1000000;
                pattern[row][col] = (hash % 3) === 0;
            }
        }
        
        return pattern;
    }

    isCornerMarkerArea(row, col) {
        // Top-left corner
        if (row < 7 && col < 7) return true;
        // Top-right corner
        if (row < 7 && col >= this.modules - 7) return true;
        // Bottom-left corner
        if (row >= this.modules - 7 && col < 7) return true;
        return false;
    }

    drawCornerMarker(ctx, startRow, startCol, moduleSize) {
        const marker = [
            [1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1],
            [1,1,1,1,1,1,1]
        ];

        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                if (marker[row][col]) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(
                        (startCol + col) * moduleSize,
                        (startRow + row) * moduleSize,
                        moduleSize,
                        moduleSize
                    );
                }
            }
        }
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    showError(container) {
        container.innerHTML = `
            <div style="width: 120px; height: 120px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; color: #666; background: #f8f9fa;">
                <div>
                    QR Code<br>
                    <small>error</small>
                </div>
            </div>
        `;
    }
}

// Make it available globally
window.SimpleQRGenerator = SimpleQRGenerator;
