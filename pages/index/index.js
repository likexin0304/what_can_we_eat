/**
 * 首页逻辑
 * 实现随机食物推荐功能
 */
const app = getApp();

Page({
  /**
   * 页面的初始数据
   * currentFood: 当前显示的食物
   * isRandomizing: 是否正在随机选择中
   * animationData: 动画数据
   */
  data: {
    currentFood: null,
    isRandomizing: false,
    animationData: {}
  },

  onLoad: function() {
    // 创建动画实例
    this.animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    });
    
    // 初始化导航标志
    this.navigating = false;
  },

  /**
   * 开始随机选择食物
   * 核心功能：随机选择食物并展示
   * 实现方式：
   * 1. 设置随机时间（3-10秒）
   * 2. 在随机时间内快速切换不同食物选项
   * 3. 结束后停留在随机选中的食物上
   * 4. 将选中的食物添加到历史记录
   */
  startRandomize: function() {
    if (this.data.isRandomizing) return;
    
    const foodOptions = app.globalData.foodOptions;
    if (foodOptions.length === 0) return;
    
    // 设置为随机选择状态
    this.setData({ isRandomizing: true });
    
    // 随机时间，3-10秒
    const randomTime = Math.floor(Math.random() * 7000) + 3000;
    const intervalTime = 100; // 切换间隔时间
    let elapsedTime = 0;
    let intervalId;
    
    // 创建淡入淡出动画
    const fadeAnimation = () => {
      this.animation.opacity(0).step();
      this.setData({ animationData: this.animation.export() });
      
      setTimeout(() => {
        // 随机选择一个食物
        const randomIndex = Math.floor(Math.random() * foodOptions.length);
        this.setData({ currentFood: foodOptions[randomIndex] });
        
        // 淡入动画
        this.animation.opacity(1).step();
        this.setData({ animationData: this.animation.export() });
      }, 150);
    };
    
    // 开始随机切换食物
    fadeAnimation();
    intervalId = setInterval(() => {
      elapsedTime += intervalTime;
      
      // 随机切换食物
      fadeAnimation();
      
      // 达到随机时间后停止
      if (elapsedTime >= randomTime) {
        clearInterval(intervalId);
        
        // 停止随机选择，但等待最后一次动画完成后再记录最终结果
        setTimeout(() => {
          // 停止随机选择，确保当前食物不再变化
          const finalSelectedFood = {...this.data.currentFood};
          
          // 添加调试日志，记录最终选择的食物
          console.log('最终选择的食物:', finalSelectedFood);
          
          // 添加到历史记录
          app.addToHistory(finalSelectedFood);
          
          // 添加调试日志，记录添加到历史记录后的历史列表
          console.log('添加到历史记录后:', app.globalData.foodHistory);
          
          // 设置为非随机选择状态
          this.setData({ isRandomizing: false });
          
          // 显示结果提示
          wx.showToast({
            title: '今天就吃这个吧！',
            icon: 'success',
            duration: 2000
          });
        }, 200); // 等待时间略大于fadeAnimation中的setTimeout时间(150ms)
      }
    }, intervalTime);
  },
  
  /**
   * 跳转到历史记录页面
   * 确保即使在随机选择过程中或刚结束后也能正常跳转
   */
  goToHistory: function() {
    // 防止快速点击或动画过程中的问题
    if (this.navigating) return;
    this.navigating = true;
    
    // 检查是否有历史记录
    if (app.globalData.foodHistory.length === 0) {
      // 如果没有历史记录，显示提示信息
      wx.showToast({
        title: '暂无历史记录，请先进行随机选择尝试哦',
        icon: 'none',
        duration: 2000
      });
      
      // 重置导航标志
      setTimeout(() => {
        this.navigating = false;
      }, 500);
      return;
    }
    
    wx.navigateTo({
      url: '/pages/history/history',
      complete: () => {
        // 导航完成后重置标志，无论成功与否
        setTimeout(() => {
          this.navigating = false;
        }, 500);
      }
    });
  }
});