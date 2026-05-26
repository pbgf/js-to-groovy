const DSL_TEMPLATE = `export class ConfigBuilder {
  /**
   * Build configuration from input parameters
   * @param props - input properties
   * @param requestContext - request context data
   * @param responseData - response data
   * @param tracerContext - tracer context data
   * @return configuration Map
   */
  run(props, requestContext, responseData, tracerContext) {
    // Modify this function to build your desired configuration
    // Currently supported syntax:
    // - ✅ Class definition and method conversion
    // - ✅ Static method support
    // - ✅ Object literal to Groovy Map syntax
    // - ✅ Array literal conversion
    // - ✅ Optional chaining operator conversion
    // - ✅ Logical OR operator conversion (|| -> ?:)
    // - ✅ Logical AND operator conversion (&&)
    // - ✅ Ternary operator conversion
    // - ✅ ES6 module export statement support
    return {
      interface: "exampleService",
      type: "thrift",
      appkey: "com.example.myapp.server",
      method: "exampleMethod",
      timeout: 1000,
      paramTypes: ["com.example.myapp.param.ExampleRequest"],
      params: [
        {
            exampleInfo: {
            // Use safe navigation operator ?. to avoid null pointer exceptions
            type: props?.dataInput?.inputType || '',
            schemeId: props?.dataInput?.activityInfo?.activityId ? '1' : '2',
            segmentIds: props?.dataInput?.segmentIds || 1,
            instanceKey: props?.componentInfo?.instanceID || '',
            instanceKey2: props?.componentInfo?.instanceID && '',
            },
            contextInfo: {
                pageId: responseData?.pageId,
            },
            location: {
                latitude: requestContext?.requestParams?.latitude || '',
                longitude: requestContext?.requestParams?.longitude || '',
                actualLatitude:
                requestContext?.requestParams?.actual_latitude || '',
                actualLongitude:
                requestContext?.requestParams?.actual_longitude || '',
            },
            pageNo: 0,
            pageSize: props?.perPageSize,
            filterSortScene: props?.filterConfig?.filterSortScene || '',
            clickId: '',
        }
      ],
    };
  }
}
`;

/**
 * Get DSL template content
 * @returns {string} DSL template string
 */
function getDSLTemplate() {
  return DSL_TEMPLATE;
}

module.exports = {
  getDSLTemplate,
  DSL_TEMPLATE,
};
