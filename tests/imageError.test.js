/**
 * 图片错误处理单元测试
 * 测试图片加载失败时的处理逻辑
 * 同时测试优化图片后的加载情况
 */

// 模拟app对象
const mockApp = {
  globalData: {
    foodHistory: [],
    foodOptions: [
      { name: '海底捞', image: '/images/haidilao.png' },
      { name: '倍乐韩国', image: '/images/beilei.png' },
      { name: '麦当劳', image: '/images/mcdonald.png' },
      { name: '测试错误路径', image: '/pages/index/images/beilei.png' }
    ],
    defaultImage: '/images/logo.png',
    imageOptimized: true,
    imageLoadErrors: []
  },
  addToHistory: function(food) {
    this.globalData.foodHistory.unshift({
      ...food,
      timestamp: new Date().toLocaleString()
    });
  },
  preloadImages: function() {
    // 模拟预加载图片的功能
    const that = this;
    console.log('模拟开始预加载图片...');
    
    // 模拟某些图片加载成功，某些失败
    this.globalData.foodOptions.forEach((food, index) => {
      if (food.image === '/images/beilei.png' && Math.random() < 0.2) {
        // 20%概率模拟beilei.png加载失败（测试边缘情况）
        const errorInfo = {
          name: food.name,
          src: food.image,
          error: 'getImageInfo:fail 模拟的随机错误'
        };
        this.globalData.imageLoadErrors.push(errorInfo);
        this.globalData.foodOptions[index].image = this.globalData.defaultImage;
        console.error(`模拟图片加载失败: ${food.name} (${food.image})`);
      } else {
        // 其他图片加载成功
        console.log(`模拟图片加载成功: ${food.name} (${food.image})`);
      }
    });
    
    return Promise.resolve();
  },
  checkImageStatus: function() {
    const totalImages = this.globalData.foodOptions.length;
    const errorCount = this.globalData.imageLoadErrors.length;
    
    return {
      totalImages,
      errorCount,
      successCount: totalImages - errorCount,
      errors: this.globalData.imageLoadErrors,
      optimized: this.globalData.imageOptimized
    };
  },
  normalizePath: function(path) {
    if (!path) return '';
    
    // 记录原始路径以便调试
    const originalPath = path;
    
    // 移除错误的前缀，如"/pages/index/images/"
    if (path.includes('/pages/index/images/')) {
      path = path.replace('/pages/index', '');
      console.log(`路径修正: ${originalPath} -> ${path}`);
    }
    
    // 确保路径以/开头
    if (path && !path.startsWith('/')) {
      path = '/' + path;
      console.log(`路径添加前导斜杠: ${originalPath} -> ${path}`);
    }
    
    return path;
  },
  tryBackupPath: function(originalPath) {
    if (!originalPath) return null;
    
    // 构建可能的备用路径
    const possiblePaths = [
      originalPath,
      // 如果原路径不以/开头，添加/
      originalPath.startsWith('/') ? originalPath : '/' + originalPath,
      // 移除pages/index前缀
      originalPath.replace('/pages/index', ''),
      // 移除错误的双重图片路径
      originalPath.replace('/images/images/', '/images/'),
      // 检查是否需要添加images
      originalPath.includes('/images/') ? originalPath : '/images/' + originalPath.replace(/^\//, '')
    ];
    
    // 返回不同于原始路径的第一个备用路径
    for (const path of possiblePaths) {
      if (path !== originalPath) {
        return path;
      }
    }
    
    // 如果没有合适的备用路径，返回null
    return null;
  },
  handleImageLoadError: function(imagePath, error) {
    console.error(`图片加载失败 [${imagePath}]:`, error);
    
    // 记录错误信息
    const errorInfo = {
      originalPath: imagePath,
      error: error.message || '未知错误',
      time: new Date().toISOString()
    };
    
    // 如果此路径的错误尚未记录，则添加到错误日志
    if (!this.globalData.imageLoadErrors.some(err => err.originalPath === imagePath)) {
      this.globalData.imageLoadErrors.push(errorInfo);
    }
    
    // 找到对应的食物选项并更新为默认图片
    const foodIndex = this.globalData.foodOptions.findIndex(
      food => food.image === imagePath
    );
    
    if (foodIndex >= 0) {
      this.globalData.foodOptions[foodIndex].image = this.globalData.defaultImage;
      console.log(`已将 ${this.globalData.foodOptions[foodIndex].name} 的图片更新为默认图片`);
    }
  },
  preloadImages: function() {
    const that = this;
    const imagePromises = [];
    
    // 遍历所有食物选项
    this.globalData.foodOptions.forEach((food, index) => {
      // 规范化图片路径
      const originalPath = food.image;
      const normalizedPath = this.normalizePath(originalPath);
      
      // 如果路径有变化，更新全局数据
      if (normalizedPath !== originalPath) {
        this.globalData.foodOptions[index].image = normalizedPath;
        console.log(`已修正图片路径: ${food.name} [${originalPath} -> ${normalizedPath}]`);
      }
      
      // 为每个图片创建加载Promise
      const imagePromise = new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: normalizedPath,
          success: (res) => {
            console.log(`图片 ${food.name} 加载成功: ${normalizedPath}`);
            resolve(res);
          },
          fail: (error) => {
            console.warn(`图片 ${food.name} 加载失败: ${normalizedPath}，尝试备用路径`);
            
            // 尝试备用路径
            const backupPath = this.tryBackupPath(normalizedPath);
            if (backupPath) {
              console.log(`尝试备用路径: ${backupPath}`);
              
              // 尝试加载备用路径
              wx.getImageInfo({
                src: backupPath,
                success: (backupRes) => {
                  console.log(`备用路径 ${backupPath} 加载成功`);
                  
                  // 更新全局数据中的图片路径
                  this.globalData.foodOptions[index].image = backupPath;
                  
                  resolve(backupRes);
                },
                fail: (backupError) => {
                  console.error(`备用路径 ${backupPath} 加载失败`);
                  
                  // 所有路径都失败，使用默认图片并记录错误
                  this.handleImageLoadError(normalizedPath, error);
                  
                  // 虽然实际加载失败，但返回成功以继续应用程序流程
                  resolve({ errMsg: "使用默认图片", path: this.globalData.defaultImage });
                }
              });
            } else {
              // 没有可用的备用路径，使用默认图片
              this.handleImageLoadError(normalizedPath, error);
              
              // 虽然实际加载失败，但返回成功以继续应用程序流程
              resolve({ errMsg: "使用默认图片", path: this.globalData.defaultImage });
            }
          }
        });
      });
      
      imagePromises.push(imagePromise);
    });
    
    // 等待所有图片加载完成
    return Promise.all(imagePromises)
      .then(() => {
        this.checkImageStatus();
        return { success: true };
      })
      .catch((error) => {
        console.error('预加载图片过程中出现错误:', error);
        this.checkImageStatus();
        return { success: false, error };
      });
  },
  checkImageStatus: function() {
    const totalImages = this.globalData.foodOptions.length;
    const errorCount = this.globalData.imageLoadErrors.length;
    const successCount = totalImages - errorCount;
    
    console.log(`图片加载状态: 总计 ${totalImages}, 成功 ${successCount}, 失败 ${errorCount}`);
    console.log(`图片已优化: ${this.globalData.imageOptimized ? '是' : '否'}`);
    
    if (errorCount > 0) {
      console.log('图片加载错误详情:', this.globalData.imageLoadErrors);
    }
    
    return {
      total: totalImages,
      success: successCount,
      errors: errorCount,
      optimized: this.globalData.imageOptimized
    };
  }
};

// 模拟wx对象
const mockWx = {
  createAnimation: function() {
    return {
      opacity: function() { return this; },
      step: function() { return this; },
      export: function() { return {}; }
    };
  },
  getImageInfo: function(options) {
    console.log(`模拟getImageInfo: ${options.src}`);
    
    // 模拟特定路径的加载失败
    const failedImages = [
      '/pages/index/images/beilei.png', // 错误的路径前缀
      'beilei.png', // 缺少前导斜杠
      '/images/error.png' // 不存在的图片
    ];
    
    // 随机模拟20%的概率加载失败
    const shouldFail = failedImages.includes(options.src) || 
                      (options.src.includes('beilei') && Math.random() < 0.2);
    
    if (shouldFail) {
      console.log(`模拟图片加载失败: ${options.src}`);
      if (options.fail) {
        options.fail({
          errMsg: `getImageInfo:fail ${options.src}`,
          message: `无法加载图片: ${options.src}`
        });
      }
    } else {
      console.log(`模拟图片加载成功: ${options.src}`);
      if (options.success) {
        options.success({
          width: 300,
          height: 300,
          path: options.src
        });
      }
    }
  },
  showToast: function(options) {
    console.log(`显示Toast: ${options.title}`);
    if (options.success) options.success();
  }
};

// 模拟Page环境
function createMockPage(options) {
  const page = {};
  
  // 初始化数据
  page.data = { ...options.data };
  
  // 设置方法
  page.setData = function(newData) {
    Object.assign(page.data, newData);
    console.log('数据更新:', JSON.stringify(newData));
  };
  
  // 添加页面中定义的方法
  Object.keys(options).forEach(key => {
    if (typeof options[key] === 'function') {
      page[key] = options[key].bind(page);
    }
  });
  
  // 调用onLoad生命周期函数
  if (page.onLoad) {
    page.onLoad();
  }
  
  return page;
}

/**
 * 测试图片错误处理功能
 */
function testImageErrorHandling() {
  console.log('开始测试图片错误处理功能...');
  
  // 设置全局变量
  global.getApp = () => mockApp;
  global.wx = mockWx;
  
  // 创建清理函数，用于测试结束后清理全局变量
  function cleanup() {
    delete global.getApp;
    delete global.wx;
  }
  
  let testPassed = true;
  
  try {
    // 模拟预加载图片
    console.log('测试1：预加载图片处理');
    mockApp.preloadImages().then((result) => {
      console.log('预加载结果:', result);
      
      const status = mockApp.checkImageStatus();
      console.log(`图片加载状态: 总计 ${status.totalImages}, 成功 ${status.successCount}, 失败 ${status.errorCount}`);
      
      // 验证优化标志
      if (!status.optimized) {
        throw new Error('图片优化标志应该为true');
      }
      
      console.log('预加载图片处理测试通过');
    });
    
    // 创建模拟页面对象
    const page = createMockPage({
      data: {
        currentFood: null,
        isRandomizing: false,
        animationData: {},
        showCustomToast: false,
        customToastText: ''
      },
      onLoad: function() {
        this.animation = wx.createAnimation({
          duration: 300,
          timingFunction: 'ease',
        });
      },
      showCustomToast: function(text, duration = 2000) {
        this.setData({
          customToastText: text,
          showCustomToast: true
        });
      },
      handleImageError: function(e) {
        console.error('图片加载失败:', e);
        
        if (!this.data.currentFood) return;
        
        // 获取图片路径信息，如果可用
        let errorPath = '';
        if (e && e.target && e.target.dataset && e.target.dataset.src) {
          errorPath = e.target.dataset.src;
        } else if (this.data.currentFood.image) {
          errorPath = this.data.currentFood.image;
        }
        
        if (errorPath) {
          console.log(`失败的图片路径: ${errorPath}`);
        }
        
        // 查找当前食物在选项中的索引
        const foodIndex = mockApp.globalData.foodOptions.findIndex(
          food => food.name === this.data.currentFood.name
        );
        
        if (foodIndex >= 0) {
          // 尝试修正图片路径问题
          const originalPath = this.data.currentFood.image;
          
          // 检查路径是否包含错误的前缀
          if (originalPath && originalPath.includes('/pages/index/images/')) {
            // 尝试修正路径
            const correctedPath = originalPath.replace('/pages/index', '');
            console.log(`尝试修正的路径: ${correctedPath}`);
            
            // 更新食物图片为修正后的路径
            const updatedFood = { ...this.data.currentFood };
            updatedFood.image = correctedPath;
            
            // 更新全局数据中的路径
            mockApp.globalData.foodOptions[foodIndex].image = correctedPath;
            
            // 更新当前显示的食物
            this.setData({ currentFood: updatedFood });
            
            // 在控制台记录修正信息
            console.log(`已尝试修正图片路径: ${originalPath} -> ${correctedPath}`);
            
            // 不显示Toast，让修正后的路径有机会加载
            // 如果修正后仍然失败，会再次触发handleImageError
            return;
          }
          
          // 如果不是路径前缀问题或修正后仍然失败，尝试其他备用路径
          const backupPath = mockApp.tryBackupPath(originalPath);
          if (backupPath && backupPath !== originalPath) {
            console.log(`尝试备用路径: ${backupPath}`);
            
            // 更新食物图片为备用路径
            const updatedFood = { ...this.data.currentFood };
            updatedFood.image = backupPath;
            
            // 更新全局数据中的路径
            mockApp.globalData.foodOptions[foodIndex].image = backupPath;
            
            // 更新当前显示的食物
            this.setData({ currentFood: updatedFood });
            
            // 在控制台记录修正信息
            console.log(`已尝试使用备用路径: ${originalPath} -> ${backupPath}`);
            
            // 不显示Toast，让备用路径有机会加载
            return;
          }
          
          // 如果路径修正和备用路径都失败，使用默认图片
          const updatedFood = { ...this.data.currentFood };
          updatedFood.image = mockApp.globalData.defaultImage;
          
          // 同时更新全局数据，防止下次随机到同一食物时再次出错
          mockApp.globalData.foodOptions[foodIndex].image = mockApp.globalData.defaultImage;
          
          // 更新当前显示的食物
          this.setData({ currentFood: updatedFood });
          
          // 显示提示
          this.showCustomToast('图片加载失败，已使用默认图片', 2000);
          
          // 记录错误信息，方便后续排查
          const errorInfo = {
            name: this.data.currentFood.name,
            originalPath: originalPath,
            error: e.detail ? e.detail.errMsg : '图片加载失败'
          };
          
          // 将错误信息添加到app的错误日志中
          if (!mockApp.globalData.imageLoadErrors.some(err => err.originalPath === originalPath)) {
            mockApp.globalData.imageLoadErrors.push(errorInfo);
          }
        }
      },
      startRandomize: function() {
        // 简化的随机选择逻辑
        this.setData({ 
          currentFood: mockApp.globalData.foodOptions[1],  // 选择"倍乐韩国"
          isRandomizing: false 
        });
      }
    });
    
    // 测试2：测试优化后的图片显示
    console.log('测试2：测试优化后的图片显示');
    
    // 获取一个没有错误的食物项
    const foodWithoutError = mockApp.globalData.foodOptions.find(
      food => !mockApp.globalData.imageLoadErrors.some(e => e.src === food.image)
    );
    
    // 设置当前食物
    page.setData({ currentFood: foodWithoutError });
    
    // 验证是否正确设置了食物
    if (!page.data.currentFood) {
      throw new Error('未能设置当前食物');
    }
    
    console.log(`显示优化后的图片: ${page.data.currentFood.name} (${page.data.currentFood.image})`);
    
    // 测试3：模拟图片加载错误事件
    console.log('测试3：模拟图片加载错误事件');
    
    // 如果前面的随机过程中已经设置了错误，使用已有的错误记录
    if (mockApp.globalData.imageLoadErrors.length > 0) {
      const errorFood = mockApp.globalData.foodOptions.find(
        food => mockApp.globalData.imageLoadErrors.some(e => e.name === food.name)
      );
      
      if (errorFood) {
        page.setData({ currentFood: errorFood });
        page.handleImageError({});
      } else {
        // 如果没有错误记录，手动创建一个
        page.setData({ currentFood: mockApp.globalData.foodOptions[1] });
        page.handleImageError({});
      }
    } else {
      // 如果没有错误记录，手动创建一个
      page.setData({ currentFood: mockApp.globalData.foodOptions[1] });
      page.handleImageError({});
    }
    
    // 验证食物图片是否已更新为默认图片
    if (page.data.currentFood.image !== mockApp.globalData.defaultImage) {
      throw new Error(`图片未更新为默认图片，当前图片为: ${page.data.currentFood.image}`);
    }
    
    // 验证是否显示了提示
    if (!page.data.showCustomToast) {
      throw new Error('未显示图片加载失败的提示');
    }
    
    if (page.data.customToastText !== '图片加载失败，已使用默认图片') {
      throw new Error(`提示文本内容错误: ${page.data.customToastText}`);
    }
    
    console.log('测试通过：图片错误处理功能正常工作，优化后的图片可以正确显示和处理错误');
    
  } catch (error) {
    console.error(`测试失败：${error.message}`);
    testPassed = false;
  } finally {
    cleanup();
  }
  
  return testPassed;
}

// 运行测试
const result = testImageErrorHandling();
console.log(`测试结果：${result ? '通过' : '失败'}`);

// 导出测试函数
module.exports = {
  testImageErrorHandling
}; 