/**
 * ============================================================
 * LUXE BEAUTY — Product Controller & Image Processor v1.0
 * Handles Base64 image preprocessing and IndexedDB storage.
 * ============================================================
 */

// 1. ຟັງຊັນສະແດງຕົວຢ່າງຮູບພາບໃນ Modal ເມື່ອຜູ້ໃຊ້ເລືອກໄຟລ໌
function previewImage(input) {
  const file = input.files[0];
  if (file) {
    // ກວດສອບປະເພດໄຟລ໌ວ່າແມ່ນຮູບພາບແທ້ຫຼືບໍ່
    if (!file.type.startsWith('image/')) {
      showToast('ກະລຸນາເລືອກໄຟລ໌ທີ່ເປັນຮູບພາບເທົ່ານັ້ນ');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const imgPreview = document.getElementById('imgPreview');
      const imgFileName = document.getElementById('imgFileName');
      const imgPreviewContainer = document.getElementById('imgPreviewContainer');

      if (imgPreview && imgFileName && imgPreviewContainer) {
        imgPreview.src = e.target.result;
        imgFileName.textContent = file.name;
        imgPreviewContainer.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }
}

// 2. ຟັງຊັນຫຼັກໃນການເພີ່ມສິນຄ້າ, ປະມວນຜົນຮູບ ແລະ ບັນທຶກລົງ IndexedDB
async function addProduct() {
  const nameElement = document.getElementById('newProductName');
  const priceElement = document.getElementById('newProductPrice');
  const stockElement = document.getElementById('newProductStock');
  const catElement = document.getElementById('newProductCat');
  const descElement = document.getElementById('newProductDesc');
  const fileInput = document.getElementById('newProductImgFile');

  // ດຶງຄ່າຈາກຟອມ
  const name = nameElement ? nameElement.value.trim() : '';
  const price = priceElement ? parseFloat(priceElement.value) || 0 : 0;
  const stock = stockElement ? parseInt(stockElement.value) || 0 : 0;
  const cat = catElement ? catElement.value : 'skincare';
  const desc = descElement ? descElement.value.trim() : '';

  // ກວດສອບຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນກ່ອນບັນທຶກ
  if (!name || price <= 0) { 
    showToast('ກະລຸນາໃສ່ຊື່ສິນຄ້າ ແລະ ລາຄາໃຫ້ຖືກຕ້ອງ'); 
    return; 
  }

  // ຕັ້ງຄ່າຮູບພາບເລີ່ມຕົ້ນ (Default Image) ຫາກຜູ້ໃຊ້ບໍ່ໄດ້ອັບໂຫຼດຮູບ
  let finalImgBase64 = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBK_xhfotC-hJHrvydSnpeXR52ybkl-yIwvWXCL-5bWpMftOKeJIxh-dq7HkYcAW1Ekg9Z0Qk4BgO6xD11a97_xrhGIG3_leiO52lnm0uCAaKHsgFnxzzG_fNpcimdJs2O6M38VktV07_VJW7y0Ettsc4Ow7fB11CJMRM1KsNz7EnCLq2F_NbVa3RluCPB5-jSwNP7EccawkYFc0lZ4t_togqhFEa9Q9IF10C6P02DKLqQSKLGiCfYGc3ggla7_SvYmy0-OuSCqUA';

  // ຖ້າມີການເລືອກໄຟລ໌ຮູບ, ໃຫ້ແປງໄຟລ໌ເປັນ Base64 String
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    finalImgBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // ສ້າງ Object ຂໍ້ມູນສິນຄ້າ (ໃຊ້ Timestamp ເປັນ ID)
  const id = Date.now();
  const newProductData = {
    id: id,
    name: name,
    price: price,
    stock: stock,
    category: cat,
    desc: desc,
    img: finalImgBase64, // ເກັບ String ຮູບພາບ Base64 ລົງຖານຂໍ້ມູນໂດຍກົງ
    revenue: 0,
    stars: 5,
    reviews: 0,
    badge: 'ໃໝ່'
  };

  try {
    // ບັນທຶກລົງ IndexedDB ຜ່ານ Database Layer (LuxeDB)
    await LuxeDB.products.save(newProductData);
    
    // ບັນທຶກປະຫວັດການເຮັດວຽກລົງ Activity Log ຂອງລະບົບ
    await LuxeDB.activityLog.add('product', 'add_box', `ເພີ່ມສິນຄ້າໃໝ່: ${name}`, 'Admin');
    
    showToast('ເພີ່ມສິນຄ້າ ແລະ ບັນທຶກລົງລະບົບສຳເລັດແລ້ວ');
    
    // ລ້າງຄ່າຂໍ້ມູນໃນຟອມອອກທັງໝົດເພື່ອປ້ອນລາຍການຕໍ່ໄປ
    if (nameElement) nameElement.value = '';
    if (priceElement) priceElement.value = '';
    if (stockElement) stockElement.value = '';
    if (descElement) descElement.value = '';
    if (fileInput) fileInput.value = '';
    
    const imgPreviewContainer = document.getElementById('imgPreviewContainer');
    if (imgPreviewContainer) imgPreviewContainer.classList.add('hidden');
    
    // ປິດ Modal ແລະ ໂຫຼດໜ້າສາງສິນຄ້າ (Inventory) ໃໝ່ເພື່ອສະແດງຜົນ
    closeModal('addProductModal');
    
    if (typeof showSection === 'function') {
      showSection('inventory'); 
    } else if (typeof renderData === 'function') {
      renderData('inventory');
    }
    
  } catch (error) {
    console.error("Error saving product to IndexedDB:", error);
    showToast('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກສິນຄ້າ');
  }
}