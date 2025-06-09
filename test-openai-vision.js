// Test script to verify OpenAI Vision API integration

// Simple test to verify the analyzer functions are properly exported
async function testAnalyzerExports() {
  try {
    // Test dynamic import of the analyzers
    const { analyzeDocumentWithVision } = await import('./src/services/openai/index.ts');
    
    console.log('✅ analyzeDocumentWithVision function imported successfully');
    
    // Create a dummy file object for testing
    class MockFile {
      constructor(name, type, content) {
        this.name = name;
        this.type = type;
        this.content = content;
        this.size = content.length;
      }
      
      async arrayBuffer() {
        return new TextEncoder().encode(this.content).buffer;
      }
    }
    
    // Test with a mock PDF file
    const mockPDF = new MockFile('test.pdf', 'application/pdf', 'mock pdf content');
    
    console.log('Testing document type routing...');
    
    try {
      // This should throw an error about invalid API key, but should not cause recursion
      await analyzeDocumentWithVision({
        file: mockPDF,
        docType: 'Profit and Loss'
      });
    } catch (error) {
      if (error.message.includes('API key') || error.message.includes('401')) {
        console.log('✅ Function routing works (API key error expected)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('Maximum call stack size exceeded')) {
      console.error('❌ RECURSION DETECTED!');
    }
  }
}

testAnalyzerExports();
