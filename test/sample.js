export class ConfigBuilder {
  run(props, requestContext, tracerContext) {
    return {
      appkey: '',
      apiName: '',
      apiUrl: '',
      instanceIdList: [],
      params: {
        configInfo: {
          // Use safe navigation operator ?. to avoid null pointer exceptions
          type: props?.dataInput?.inputType || '',
          schemeId: props?.dataInput?.activityInfo?.activityId?.includes('1') ? '1' : '2',
          schemeId2: props?.dataInput?.activityInfo?.activityId?.includes?.('1') ? '1' : '2',
          segmentIds: props?.dataInput?.segmentIds || 1,
          instanceKey: props?.componentInfo?.instanceID || '',
          instanceKey2: props?.componentInfo?.instanceID && '',
        },
        // Use actual values instead of string expressions
        latitude: requestContext?.location?.lat || 0.0,
        longitude: requestContext?.location?.lng || 0.0,
        actualLatitude: requestContext?.actual?.lat || 0.0,
        actualLongitude: requestContext?.actual?.lng || 0.0,
        pageNo: 0,
        pageSize: 20,
        filterScene: props?.filterConfig?.filterScene || '',
        clickId: '',
      },
    };
  }
}

// Test try-catch, object destructuring, array method chaining and arrow function support
export class EnhancedConfigBuilder {
  createConfig(props, commonParams) {
    try {
      // Test object destructuring
      const { dataInput, componentInfo } = props || {};
      const { location, actual } = commonParams || {};

      // Test if statement
      if (!dataInput) {
        return { error: 'No data input provided' };
      }

      // Test array method chaining and arrow function
      const items = ['food', 'hotel', 'movie'].map((category) => ({
        type: category,
        enabled: true,
      }));

      // Test array destructuring
      const [primaryCategory, secondaryCategory] = dataInput.categories || [];

      return {
        appkey: 'enhanced-api',
        params: {
          type: dataInput.inputType || '',
          categories: items,
          primaryCategory: primaryCategory || 'default',
          secondaryCategory: secondaryCategory || 'default',
          location: {
            latitude: location?.lat || 0.0,
            longitude: location?.lng || 0.0,
          },
        },
      };
    } catch (error) {
      console.error('Failed to create config:', error);
      return { error: true };
    }
  }
}

// Test JSON.parse and complex try-catch structure
export function processProductData(rawData) {
  if (!rawData) return [];

  try {
    // Test JSON.parse conversion
    const { productList } = JSON.parse(rawData);

    if (!productList || !Array.isArray(productList)) {
      return [];
    }

    return null;
  } catch (error) {
    console.error('Failed to process product data:', error);
    return [];
  }
}

// Test complex if-else structure
export function determineUserLevel(user) {
  if (!user) {
    return 'guest';
  } else if (user.vip && user.points > 1000) {
    return 'platinum';
  } else if (user.vip) {
    return 'gold';
  } else if (user.points > 500) {
    return 'silver';
  } else {
    return 'bronze';
  }
}
