document.addEventListener('DOMContentLoaded', () => {
  // Modal Helpers
  window.openModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  };

  window.closeModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  };

  // Close modals when clicking outside content
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Open Rename Folder Modal
  window.openRenameModal = function (folderId, currentName) {
    const form = document.getElementById('renameFolderForm');
    const input = document.getElementById('renameFolderNameInput');
    if (form && input) {
      form.action = `/drive/folder/${folderId}/rename`;
      input.value = currentName;
      openModal('renameFolderModal');
    }
  };

  // Open Share Folder Modal
  window.openShareModal = function (folderId, folderName) {
    const input = document.getElementById('shareFolderIdInput');
    const nameEl = document.getElementById('shareFolderNameText');
    if (input && nameEl) {
      input.value = folderId;
      nameEl.textContent = folderName;
      openModal('shareFolderModal');
    }
  };

  // Copy share URL to clipboard
  window.copyShareUrl = function (url) {
    navigator.clipboard.writeText(url).then(() => {
      alert('¡Enlace de compartir copiado al portapapeles!');
    }).catch(err => {
      console.error('Error al copiar enlace:', err);
    });
  };
});
