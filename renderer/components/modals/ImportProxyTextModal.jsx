import React, { useState } from 'react';
import { Modal, Button, Form, Select } from 'antd';
import { useTranslation } from 'react-i18next';

const ImportProxyTextModal = ({ isOpen, onClose, onImport }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [folderId, setFolderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState([]); // Các folder sẽ được fetch từ API

  // Fetch folders khi component mount
  React.useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      // Lấy danh sách folders từ window.tiktokAPI nếu có
      if (window.tiktokAPI && typeof window.tiktokAPI.getProxyFolders === 'function') {
        const fetchedFolders = await window.tiktokAPI.getProxyFolders();
        setFolders(fetchedFolders || []);
      }
    } catch (error) {
      console.error('Error fetching proxy folders:', error);
    }
  };

  const handleImport = async () => {
    if (!text) {
      // Hiển thị thông báo lỗi
      return;
    }

    setLoading(true);

    try {
      // Gọi API import từ text
      if (window.tiktokAPI && typeof window.tiktokAPI.importProxiesFromText === 'function') {
        const result = await window.tiktokAPI.importProxiesFromText(text, folderId);
        if (result && result.success) {
          // Thông báo thành công
          Modal.success({
            title: t('proxies.importModal.success'),
            content: t('proxies.importModal.imported', { count: result.importedCount || 0 }),
            onOk: () => {
              // Đóng modal và trả về kết quả
              if (onImport) {
                onImport(result);
              }
              onClose();
            }
          });
        } else {
          // Thông báo lỗi
          Modal.error({
            title: t('proxies.importModal.error'),
            content: result?.error || 'Error importing proxies'
          });
        }
      } else {
        // API không khả dụng
        Modal.error({
          title: t('proxies.importModal.error'),
          content: 'API not available'
        });
      }
    } catch (error) {
      console.error('Error importing proxies:', error);
      Modal.error({
        title: t('proxies.importModal.error'),
        content: error.message || 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('proxies.importModal.title')}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="import"
          type="primary"
          loading={loading}
          onClick={handleImport}
        >
          {loading ? t('proxies.importModal.importing') : t('proxies.importModal.import')}
        </Button>
      ]}
      width={600}
    >
      <Form layout="vertical">
        <Form.Item label={t('proxies.addModal.folder')}>
          <Select
            placeholder={t('proxies.addModal.folder')}
            value={folderId}
            onChange={setFolderId}
            style={{ width: '100%' }}
          >
            {folders.map(folder => (
              <Select.Option key={folder.id} value={folder.id}>
                {folder.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item 
          label={t('proxies.importModal.orText')}
          validateStatus={text ? 'success' : 'error'}
          help={!text && 'Please enter proxy list'}
        >
          <textarea
            style={{
              width: '100%',
              height: '150px',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
              resize: 'vertical'
            }}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t('proxies.importModal.textPlaceholder')}
          />
        </Form.Item>
        <div style={{ marginBottom: '10px' }}>
          <p>Format: ip:port:username:password or ip:port</p>
          <p>One proxy per line</p>
        </div>
      </Form>
    </Modal>
  );
};

export default ImportProxyTextModal; 