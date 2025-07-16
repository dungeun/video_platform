import PDFDocument from 'pdfkit';
import { Contract, Party, Signature } from '../types';

export class PDFGenerator {
  async generateContractPDF(contract: Contract): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc, contract);

      // Contract content
      this.addContent(doc, contract);

      // Signatures section
      if (contract.signatures.length > 0) {
        this.addSignatures(doc, contract);
      }

      // Footer
      this.addFooter(doc, contract);

      doc.end();
    });
  }

  private addHeader(doc: PDFDocument, contract: Contract): void {
    // Title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(contract.title, { align: 'center' });

    doc.moveDown();

    // Contract ID and dates
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Contract ID: ${contract.id}`, { align: 'right' })
       .text(`Created: ${contract.createdAt.toLocaleDateString()}`, { align: 'right' });

    if (contract.completedAt) {
      doc.text(`Completed: ${contract.completedAt.toLocaleDateString()}`, { align: 'right' });
    }

    doc.moveDown(2);
    doc.fillColor('#000000');
  }

  private addContent(doc: PDFDocument, contract: Contract): void {
    // Parse and render contract content
    const lines = contract.content.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        // H1
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text(line.substring(2), { align: 'left' });
        doc.moveDown(0.5);
      } else if (line.startsWith('## ')) {
        // H2
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(line.substring(3), { align: 'left' });
        doc.moveDown(0.5);
      } else if (line.startsWith('### ')) {
        // H3
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(line.substring(4), { align: 'left' });
        doc.moveDown(0.5);
      } else if (line.startsWith('- ')) {
        // List item
        doc.fontSize(11)
           .font('Helvetica')
           .text(`• ${line.substring(2)}`, { 
             align: 'left',
             indent: 20
           });
      } else if (line.includes('**')) {
        // Bold text
        const parts = line.split('**');
        doc.fontSize(11);
        
        parts.forEach((part, index) => {
          if (index % 2 === 0) {
            doc.font('Helvetica').text(part, { continued: index < parts.length - 1 });
          } else {
            doc.font('Helvetica-Bold').text(part, { continued: index < parts.length - 1 });
          }
        });
        doc.text('');
      } else if (line.trim()) {
        // Regular paragraph
        doc.fontSize(11)
           .font('Helvetica')
           .text(line, { align: 'justify' });
      } else {
        // Empty line
        doc.moveDown(0.5);
      }
    });
  }

  private addSignatures(doc: PDFDocument, contract: Contract): void {
    doc.addPage();
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Signatures', { align: 'center' });
    
    doc.moveDown(2);

    contract.parties
      .filter(party => party.role === 'client' || party.role === 'contractor')
      .forEach(party => {
        const signature = contract.signatures.find(s => s.partyId === party.id);
        
        this.addSignatureBlock(doc, party, signature);
        doc.moveDown(3);
      });
  }

  private addSignatureBlock(
    doc: PDFDocument, 
    party: Party, 
    signature?: Signature
  ): void {
    const startY = doc.y;

    // Party info
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(`${party.role.toUpperCase()}: ${party.name}`);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Email: ${party.email}`);
    
    if (party.company) {
      doc.text(`Company: ${party.company}`);
    }

    doc.fillColor('#000000');
    doc.moveDown();

    if (signature) {
      // Signed
      if (signature.type === 'typed') {
        doc.fontSize(16)
           .font('Helvetica-Oblique')
           .text(signature.data, { align: 'left' });
      } else if (signature.type === 'drawn' || signature.type === 'uploaded') {
        // In a real implementation, we would decode and embed the image
        doc.rect(doc.x, doc.y, 200, 50)
           .stroke()
           .fontSize(10)
           .text('[Signature Image]', doc.x + 70, doc.y + 20);
        doc.y += 60;
      }

      doc.fontSize(10)
         .font('Helvetica')
         .text(`Signed on: ${signature.timestamp.toLocaleString()}`);
      
      if (signature.ipAddress) {
        doc.text(`IP Address: ${signature.ipAddress}`);
      }
    } else {
      // Not signed yet
      doc.moveDown();
      doc.text('_________________________________');
      doc.text('Signature');
      doc.moveDown();
      doc.text('_________________________________');
      doc.text('Date');
    }
  }

  private addFooter(doc: PDFDocument, contract: Contract): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Page number
      doc.fontSize(9)
         .fillColor('#666666')
         .text(
           `Page ${i + 1} of ${pageCount}`,
           50,
           doc.page.height - 30,
           { align: 'center' }
         );
      
      // Contract verification
      if (contract.status === 'signed' && contract.completedAt) {
        doc.fontSize(8)
           .text(
             `This contract was digitally signed and completed on ${contract.completedAt.toLocaleDateString()}`,
             50,
             doc.page.height - 20,
             { align: 'center' }
           );
      }
    }
  }

  async generateCoverPage(contract: Contract): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4' });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Logo area (placeholder)
      doc.rect(doc.page.width / 2 - 50, 100, 100, 100)
         .stroke();
      
      doc.fontSize(10)
         .text('[Company Logo]', doc.page.width / 2 - 30, 140);

      doc.moveDown(10);

      // Title
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('CONTRACT', { align: 'center' });
      
      doc.fontSize(18)
         .font('Helvetica')
         .text(contract.title, { align: 'center' });

      doc.moveDown(4);

      // Parties
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Between:', { align: 'center' });
      
      doc.moveDown();

      contract.parties
        .filter(p => p.role === 'client' || p.role === 'contractor')
        .forEach((party, index) => {
          if (index > 0) {
            doc.fontSize(12)
               .font('Helvetica')
               .text('and', { align: 'center' });
            doc.moveDown();
          }
          
          doc.fontSize(14)
             .font('Helvetica')
             .text(party.name, { align: 'center' });
          
          if (party.company) {
            doc.fontSize(12)
               .text(party.company, { align: 'center' });
          }
          
          doc.moveDown();
        });

      // Date
      doc.moveDown(4);
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Date: ${contract.createdAt.toLocaleDateString()}`, { align: 'center' });

      doc.end();
    });
  }
}