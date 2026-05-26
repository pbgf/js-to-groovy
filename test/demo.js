const JSToGroovyTranspiler = require('../src/index');
const transpiler = new JSToGroovyTranspiler();
const result = transpiler.transpile(`
  let result = [];
  if (onceData) {
    try {
      const { previewProductInfo } = JSON.parse(decodeURIComponent(onceData));
      result = previewProductInfo.split('#').map((item) => ({
          shopId: shopId || '',
          spuId: spuId || '',
        }));
    } catch (error) {
      result = [];
    }
  }
}
`);
console.log('result', result);
