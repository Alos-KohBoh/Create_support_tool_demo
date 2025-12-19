// 一時的なパッチスクリプト: characterLevelUpConfigのlocalStorageデータを削除
(function() {
  const key = 'masterConfig';
  const saved = localStorage.getItem(key);
  if (!saved) return;
  try {
    const config = JSON.parse(saved);
    if (config.characterLevelUpConfig) {
      delete config.characterLevelUpConfig;
      localStorage.setItem(key, JSON.stringify(config));
      alert('古いキャラクター用成長値データを削除しました。');
    }
  } catch(e) {}
})();
