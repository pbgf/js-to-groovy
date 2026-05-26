const JSToGroovyTranspiler = require('../src/index');
const fs = require('fs');
const path = require('path');

describe('JSToGroovyTranspiler', () => {
  let transpiler;

  beforeEach(() => {
    transpiler = new JSToGroovyTranspiler();
  });

  test('should transpile simple class definition', () => {
    const jsCode = `
class TestClass {
  testMethod(param1, param2) {
    return { key: 'value' };
  }
}`;

    const result = transpiler.transpile(jsCode);
    expect(result).toContain('class TestClass');
    expect(result).toContain('Map testMethod(Map param1, Map param2)');
    expect(result).toContain("return [key: 'value']");
  });

  test('should transpile static methods', () => {
    const jsCode = `
class TestClass {
  static create(param) {
    return { result: param };
  }
}`;

    const result = transpiler.transpile(jsCode);
    expect(result).toContain('static Map create(Map param)');
  });

  test('should transpile logical AND operator', () => {
    const jsCode = `
class TestClass {
  test() {
    return { list: 0 && [1, 2, 3] };
  }
}`;

    const result = transpiler.transpile(jsCode);
    expect(result).toContain('[1, 2, 3]');
  });

  test('should transpile optional chaining operator', () => {
    const jsCode = `
class TestClass {
  test(obj) {
    return { value: obj?.prop?.nested || 'default' };
  }
}`;

    const result = transpiler.transpile(jsCode);
    expect(result).toContain("obj?.prop?.nested ?: 'default'");
  });

  test('should transpile ternary operator', () => {
    const jsCode = `
class TestClass {
  test(condition) {
    return { result: condition ? 'yes' : 'no' };
  }
}`;

    const result = transpiler.transpile(jsCode);
    expect(result).toContain("condition ? 'yes' : 'no'");
  });

  test('should transpile array literal', () => {
    const jsCode = `
class TestClass {
  test() {
    return { list: [1, 2, 3] };
  }
}`;

    const result = transpiler.transpile(jsCode);
    expect(result).toContain('[1, 2, 3]');
  });

  test('should transpile logical AND with optional chaining', () => {
    const jsCode = `
class TestClass {
  test(obj) {
    return { value: obj?.prop && 'exists' };
  }
}`;

    const result = transpiler.transpile(jsCode);
    expect(result).toContain("obj?.prop && 'exists'");
  });

  test('should transpile export class declaration', () => {
    const jsCode = `
export class TestClass {
  test() {
    return { value: 'test' };
  }
}`;

    const result = transpiler.transpile(jsCode);
    expect(result).toContain('class TestClass');
    expect(result).toContain("value: 'test'");
    expect(result).not.toContain('export');
  });

  test('should detect unsupported syntax and throw error', () => {
    const jsCode = `
class TestClass {
  async test() {
    await someFunction();
  }
}`;

    expect(() => {
      transpiler.transpile(jsCode);
    }).toThrow();
  });

  test('should transpile complete sample file', () => {
    const samplePath = path.join(__dirname, 'sample.js');
    const jsCode = fs.readFileSync(samplePath, 'utf8');

    const result = transpiler.transpile(jsCode);

    // Verify basic structure
    expect(result).toContain('class ConfigBuilder');
    expect(result).toContain('Map run(Map props, Map requestContext, Map tracerContext)');

    // Verify optional chaining conversion
    expect(result).toContain("props?.dataInput?.inputType ?: ''");
    expect(result).toContain('requestContext?.location?.lat ?: 0');

    // Verify ternary operator and includes->contains conversion
    expect(result).toContain("props?.dataInput?.activityInfo?.activityId?.contains('1') ? '1' : '2'");
    expect(result).toContain("props?.dataInput?.activityInfo?.activityId?.contains?.call('1') ? '1' : '2'");

    // Verify logical AND operator conversion
    expect(result).toContain("props?.componentInfo?.instanceID && ''");

    // Verify object structure
    expect(result).toContain("appkey: ''");
    expect(result).toContain('instanceIdList: []');
  });

  test('should distinguish optional chaining method call vs optional call expression', () => {
    // Case 1: Normal optional chaining method call - no ?.call needed
    const code1 = `
class Test {
  test(props) {
    return props?.dataInput?.activityInfo?.activityId?.includes('1') ? '1' : '2';
  }
}`;

    const result1 = transpiler.transpile(code1);
    expect(result1).toContain("props?.dataInput?.activityInfo?.activityId?.contains('1')");
    expect(result1).not.toContain('?.call');

    // Case 2: Optional call expression - ?.call needed
    const code2 = `
class Test {
  test(props) {
    return props?.dataInput?.activityInfo?.activityId?.includes?.('1') ? '1' : '2';
  }
}`;

    const result2 = transpiler.transpile(code2);
    expect(result2).toContain("props?.dataInput?.activityInfo?.activityId?.contains?.call('1')");
  });
});
