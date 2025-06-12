import React, { useState } from 'react';
import { Modal, Button, Form, Select } from 'antd';
import { useTranslation } from 'react-i18next';

const ImportAccountTextModal = ({ isOpen, onClose, onImport }) => {
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
      if (window.tiktokAPI && typeof window.tiktokAPI.getAccountFolders === 'function') {
        const fetchedFolders = await window.tiktokAPI.getAccountFolders();
        setFolders(fetchedFolders || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
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
      if (window.tiktokAPI && typeof window.tiktokAPI.importAccountsFromText === 'function') {
        const result = await window.tiktokAPI.importAccountsFromText(text, folderId);
        if (result && result.success) {
          // Thông báo thành công
          Modal.success({
            title: t('accounts.importSuccess', { imported: result.importedCount || 0 }),
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
            title: t('accounts.importError'),
            content: result?.error || t('accounts.errors.importTextGeneral')
          });
        }
      } else {
        // API không khả dụng
        Modal.error({
          title: t('accounts.importError'),
          content: t('accounts.errors.importTextGeneral')
        });
      }
    } catch (error) {
      console.error('Error importing accounts:', error);
      Modal.error({
        title: t('accounts.importError'),
        content: error.message || t('accounts.errors.importTextGeneral')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('accounts.modal.importText.title')}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('accounts.modal.importText.cancel')}
        </Button>,
        <Button
          key="import"
          type="primary"
          loading={loading}
          onClick={handleImport}
        >
          {loading ? t('accounts.modal.importText.importing') : t('accounts.modal.importText.import')}
        </Button>
      ]}
      width={600}
    >
      <Form layout="vertical">
        <Form.Item label={t('accounts.modal.importText.folder')}>
          <Select
            placeholder={t('accounts.modal.importText.folder')}
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
          label={t('accounts.modal.importText.text')}
          validateStatus={text ? 'success' : 'error'}
          help={!text && t('accounts.modal.importText.validation.emptyData')}
        >
          <Form.Item style={{ marginBottom: 8 }} help={t('accounts.modal.importText.formatDescription')}>
            <p>{t('accounts.modal.importText.note1')}</p>
            <p>{t('accounts.modal.importText.note2')}</p>
            <p>{t('accounts.modal.importText.note3')}</p>
            <p>{t('accounts.modal.importText.note4')}</p>
          </Form.Item>
          <Form.Item>
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
              placeholder={t('accounts.modal.importText.textPlaceholder')}
            />
          </Form.Item>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ImportAccountTextModal; 