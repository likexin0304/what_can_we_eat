/**
 * 历史记录页面逻辑
 * 展示用户的食物选择历史记录
 */
const app = getApp();

Page({
  /**
   * 页面的初始数据
   * historyList: 历史记录列表
   */
  data: {
    historyList: []
  },

  /**
   * 生命周期函数--监听页面加载
   * 加载全局数据中的历史记录
   */
  onLoad: function() {
    // 添加调试日志，记录加载时的历史记录
    console.log('历史页面加载时的历史记录:', app.globalData.foodHistory);
    
    this.setData({
      historyList: app.globalData.foodHistory
    });
    
    // 添加调试日志，记录设置到页面的历史列表
    console.log('设置到页面的历史列表:', this.data.historyList);
  },
  
  /**
   * 生命周期函数--监听页面显示
   * 确保每次显示页面时都获取最新的历史记录
   */
  onShow: function() {
    this.setData({
      historyList: app.globalData.foodHistory
    });
  },
  
  /**
   * 清空历史记录
   * 清空全局数据中的历史记录并更新页面
   */
  clearHistory: function() {
    wx.showModal({
      title: '提示',
      content: '确定要清空历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清空全局数据中的历史记录
          app.globalData.foodHistory = [];
          // 更新页面数据
          this.setData({
            historyList: []
          });
          // 显示提示
          wx.showToast({
            title: '已清空历史记录',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },
  
  /**
   * 返回首页
   */
  goBack: function() {
    wx.navigateBack();
  }
});