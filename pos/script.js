        // Global variables
        let currentUser = null;
        let userRole = null;
        let cart = [];
        let products = [];
        let sales = [];
        let members = [];
        let codeReader = null;
        let selectedDeviceId = null;
        let cashDrawerBalance = 0;

        // Initialize sample data
        function initializeData() {
            if (!localStorage.getItem('products')) {
                localStorage.setItem('products', JSON.stringify([]));
            }
            
            if (!localStorage.getItem('sales')) {
                localStorage.setItem('sales', JSON.stringify([]));
            }
            
            if (!localStorage.getItem('members')) {
                localStorage.setItem('members', JSON.stringify([]));
            }
            
            loadData();
        }

        function loadData() {
            products = JSON.parse(localStorage.getItem('products')) || [];
            sales = JSON.parse(localStorage.getItem('sales')) || [];
            members = JSON.parse(localStorage.getItem('members')) || [];
        }

        function saveData() {
            localStorage.setItem('products', JSON.stringify(products));
            localStorage.setItem('sales', JSON.stringify(sales));
            localStorage.setItem('members', JSON.stringify(members));
        }

        // Authentication
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if ((username === 'admin' && password === 'Tle019') || 
                (username === 'cashier' && password === '123456')) {
                currentUser = username;
                userRole = username === 'admin' ? 'admin' : 'cashier';
                document.getElementById('currentUser').textContent = username;
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('cashCountScreen').classList.remove('hidden');
                
                // Hide admin-only sections for cashier
                if (userRole === 'cashier') {
                    document.querySelector('button[onclick="showSection(\'products\')"]').style.display = 'none';
                }
                
                initializeData();
            } else {
                alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            }
        });

        // Cash Count Form
        document.getElementById('cashCountForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const initialCash = parseFloat(document.getElementById('initialCash').value) || 0;
            
            if (initialCash < 0) {
                alert('จำนวนเงินต้องไม่น้อยกว่า 0');
                return;
            }
            
            cashDrawerBalance = initialCash;
            
            // Save initial cash to localStorage for the session
            localStorage.setItem('sessionCashBalance', cashDrawerBalance.toString());
            localStorage.setItem('sessionStartTime', new Date().toISOString());
            
            document.getElementById('cashCountScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            showSection('pos');
        });

        function logout() {
            currentUser = null;
            userRole = null;
            cart = [];
            cashDrawerBalance = 0;
            
            // Clear session data
            localStorage.removeItem('sessionCashBalance');
            localStorage.removeItem('sessionStartTime');
            
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
            document.getElementById('cashCountScreen').classList.add('hidden');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            document.getElementById('initialCash').value = '';
        }

        // Navigation
        function showSection(section) {
            // Hide all sections
            document.querySelectorAll('[id$="Section"]').forEach(el => el.classList.add('hidden'));
            
            // Show selected section
            document.getElementById(section + 'Section').classList.remove('hidden');
            
            // Update navigation buttons
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            event.target.classList.remove('bg-gray-200', 'text-gray-700');
            event.target.classList.add('bg-blue-600', 'text-white');
            
            // Load section data
            if (section === 'pos') {
                loadProductGrid();
                updateCart();
            } else if (section === 'products') {
                loadProductsTable();
            } else if (section === 'stock') {
                loadStockTable();
                checkLowStock();
            } else if (section === 'members') {
                loadMembersTable();
                loadMembersSummary();
            } else if (section === 'reports') {
                loadSalesHistory();
                setDefaultDates();
            }
        }

        // POS Functions
        function loadProductGrid() {
            const grid = document.getElementById('productGrid');
            grid.innerHTML = '';
            
            products.forEach(product => {
                // Calculate available stock (current stock minus items in cart)
                const cartItem = cart.find(item => item.code === product.code);
                const availableStock = product.stock - (cartItem ? cartItem.quantity : 0);
                
                const productCard = document.createElement('div');
                const isOutOfStock = availableStock <= 0;
                const isLowStock = availableStock > 0 && availableStock < 10;
                
                productCard.className = `p-4 rounded-lg cursor-pointer transition ${
                    isOutOfStock ? 'bg-red-100 opacity-50 cursor-not-allowed' :
                    isLowStock ? 'bg-yellow-50 hover:bg-yellow-100' :
                    'bg-gray-50 hover:bg-gray-100'
                }`;
                
                if (!isOutOfStock) {
                    productCard.onclick = () => addProductToCart(product.code);
                }
                
                productCard.innerHTML = `
                    <div class="text-sm font-medium ${isOutOfStock ? 'text-gray-500' : ''}">${product.name}</div>
                    <div class="text-xs text-gray-600">${product.code}</div>
                    <div class="text-sm font-semibold ${isOutOfStock ? 'text-gray-400' : 'text-blue-600'}">${product.price} บาท</div>
                    <div class="text-xs ${
                        isOutOfStock ? 'text-red-600 font-semibold' :
                        isLowStock ? 'text-yellow-600 font-semibold' :
                        'text-gray-500'
                    }">
                        ${isOutOfStock ? 'สินค้าหมด' : `คงเหลือ: ${availableStock} ชิ้น`}
                    </div>
                `;
                grid.appendChild(productCard);
            });
        }

        function filterProducts(category) {
            // Update category buttons
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            event.target.classList.remove('bg-gray-200', 'text-gray-700');
            event.target.classList.add('bg-blue-600', 'text-white');
            
            const grid = document.getElementById('productGrid');
            grid.innerHTML = '';
            
            const filteredProducts = category === 'all' ? products : products.filter(p => p.category === category);
            
            filteredProducts.forEach(product => {
                // Calculate available stock for filtered view too
                const cartItem = cart.find(item => item.code === product.code);
                const availableStock = product.stock - (cartItem ? cartItem.quantity : 0);
                const isOutOfStock = availableStock <= 0;
                const isLowStock = availableStock > 0 && availableStock < 10;
                
                const productCard = document.createElement('div');
                productCard.className = `p-4 rounded-lg cursor-pointer transition ${
                    isOutOfStock ? 'bg-red-100 opacity-50 cursor-not-allowed' :
                    isLowStock ? 'bg-yellow-50 hover:bg-yellow-100' :
                    'bg-gray-50 hover:bg-gray-100'
                }`;
                
                if (!isOutOfStock) {
                    productCard.onclick = () => addProductToCart(product.code);
                }
                
                productCard.innerHTML = `
                    <div class="text-sm font-medium ${isOutOfStock ? 'text-gray-500' : ''}">${product.name}</div>
                    <div class="text-xs text-gray-600">${product.code}</div>
                    <div class="text-sm font-semibold ${isOutOfStock ? 'text-gray-400' : 'text-blue-600'}">${product.price} บาท</div>
                    <div class="text-xs ${
                        isOutOfStock ? 'text-red-600 font-semibold' :
                        isLowStock ? 'text-yellow-600 font-semibold' :
                        'text-gray-500'
                    }">
                        ${isOutOfStock ? 'สินค้าหมด' : `คงเหลือ: ${availableStock} ชิ้น`}
                    </div>
                `;
                grid.appendChild(productCard);
            });
        }

        function addToCart() {
            const searchInput = document.getElementById('productSearch');
            const productCode = searchInput.value.trim();
            
            if (productCode) {
                addProductToCart(productCode);
                searchInput.value = '';
            }
        }

        function addProductToCart(productCode) {
            const product = products.find(p => p.code === productCode);
            if (!product) {
                showErrorMessage('ไม่พบสินค้า: ' + productCode);
                return;
            }
            
            if (product.stock <= 0) {
                showErrorMessage(`สินค้า ${product.name} หมดแล้ว`);
                return;
            }
            
            // Calculate current quantity in cart
            const existingItem = cart.find(item => item.code === productCode);
            const currentCartQuantity = existingItem ? existingItem.quantity : 0;
            
            // Check if we can add one more
            if (currentCartQuantity >= product.stock) {
                showErrorMessage(`สินค้า ${product.name} ไม่เพียงพอ (คงเหลือ ${product.stock} ชิ้น)`);
                return;
            }
            
            if (existingItem) {
                existingItem.quantity++;
                existingItem.maxStock = product.stock; // Update max stock in real-time
            } else {
                cart.push({
                    code: product.code,
                    name: product.name,
                    price: product.price,
                    cost: product.cost,
                    quantity: 1,
                    maxStock: product.stock
                });
            }
            
            updateCart();
            showSuccessMessage(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`);
        }

        function showErrorMessage(message) {
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        function updateCart() {
            const cartItems = document.getElementById('cartItems');
            const totalAmount = document.getElementById('totalAmount');
            
            // Update cash balance display
            const cashBalanceElement = document.getElementById('currentCashBalance');
            if (cashBalanceElement) {
                cashBalanceElement.textContent = cashDrawerBalance.toFixed(2) + ' บาท';
            }
            
            cartItems.innerHTML = '';
            let total = 0;
            
            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                
                const cartItem = document.createElement('div');
                cartItem.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg';
                cartItem.innerHTML = `
                    <div class="flex-1">
                        <div class="font-medium">${item.name}</div>
                        <div class="text-sm text-gray-600">${item.price} บาท x ${item.quantity}</div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="changeQuantity(${index}, -1)" class="w-8 h-8 bg-red-500 text-white rounded-full text-sm hover:bg-red-600">-</button>
                        <span class="w-8 text-center">${item.quantity}</span>
                        <button onclick="changeQuantity(${index}, 1)" class="w-8 h-8 bg-green-500 text-white rounded-full text-sm hover:bg-green-600">+</button>
                        <button onclick="removeFromCart(${index})" class="w-8 h-8 bg-gray-500 text-white rounded-full text-sm hover:bg-gray-600">×</button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            });
            
            totalAmount.textContent = total.toFixed(2) + ' บาท';
            
            // Update change calculation
            calculateChange();
        }

        function changeQuantity(index, change) {
            const item = cart[index];
            const product = products.find(p => p.code === item.code);
            const newQuantity = item.quantity + change;
            
            if (newQuantity <= 0) {
                removeFromCart(index);
                return;
            }
            
            // Check against current stock, not the maxStock from when item was added
            const currentStock = product ? product.stock : item.maxStock;
            if (newQuantity > currentStock) {
                showErrorMessage(`สินค้า ${item.name} ไม่เพียงพอ (คงเหลือ ${currentStock} ชิ้น)`);
                return;
            }
            
            item.quantity = newQuantity;
            item.maxStock = currentStock; // Update max stock reference
            updateCart();
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            updateCart();
        }

        function clearCart() {
            cart = [];
            updateCart();
            document.getElementById('customerPayment').value = '';
        }

        function calculateChange() {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const payment = parseFloat(document.getElementById('customerPayment').value) || 0;
            const change = payment - total;
            
            document.getElementById('changeAmount').textContent = change.toFixed(2) + ' บาท';
            document.getElementById('changeAmount').className = change >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600';
        }

        document.getElementById('customerPayment').addEventListener('input', calculateChange);
        
        // Member number validation
        document.getElementById('memberNumber').addEventListener('input', function() {
            const memberNumber = this.value.trim();
            const memberInfo = document.getElementById('memberInfo');
            
            if (memberNumber) {
                const member = members.find(m => m.number === memberNumber);
                if (member) {
                    memberInfo.innerHTML = `
                        <div class="text-green-600">
                            ✓ ${member.firstName} ${member.lastName} (${member.grade})
                            <br>ยอดซื้อสะสม: ${member.totalPurchases.toFixed(2)} บาท
                        </div>
                    `;
                } else {
                    memberInfo.innerHTML = '<div class="text-red-600">⚠ ไม่พบหมายเลขสมาชิกนี้</div>';
                }
            } else {
                memberInfo.innerHTML = '';
            }
        });

        function completeSale() {
            if (cart.length === 0) {
                alert('ไม่มีสินค้าในตะกร้า');
                return;
            }
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const payment = parseFloat(document.getElementById('customerPayment').value) || 0;
            
            if (payment < total) {
                alert('เงินที่รับไม่เพียงพอ');
                return;
            }
            
            const changeNeeded = payment - total;
            if (changeNeeded > cashDrawerBalance) {
                alert(`เงินในลิ้นชักไม่เพียงพอสำหรับทอน (ต้องการ ${changeNeeded.toFixed(2)} บาท แต่มีเพียง ${cashDrawerBalance.toFixed(2)} บาท)`);
                return;
            }
            
            // Check stock availability before completing sale
            for (let item of cart) {
                const product = products.find(p => p.code === item.code);
                if (!product || product.stock < item.quantity) {
                    alert(`สินค้า ${item.name} มีจำนวนไม่เพียงพอ (คงเหลือ ${product ? product.stock : 0} ชิ้น)`);
                    return;
                }
            }
            
            // Update stock - deduct sold quantities
            cart.forEach(item => {
                const product = products.find(p => p.code === item.code);
                if (product) {
                    product.stock -= item.quantity;
                }
            });
            
            // Update cash drawer balance
            cashDrawerBalance += payment; // Add payment received
            cashDrawerBalance -= (payment - total); // Subtract change given
            // Net effect: cashDrawerBalance += total (only the sale amount stays in drawer)
            
            // Save updated balance
            localStorage.setItem('sessionCashBalance', cashDrawerBalance.toString());
            
            // Get member information
            const memberNumber = document.getElementById('memberNumber').value.trim();
            let memberData = null;
            if (memberNumber) {
                memberData = members.find(m => m.number === memberNumber);
                if (memberData) {
                    memberData.totalPurchases += total;
                    memberData.purchaseCount += 1;
                }
            }

            // Record sale
            const sale = {
                id: Date.now(),
                date: new Date().toLocaleDateString('th-TH'),
                time: new Date().toLocaleTimeString('th-TH'),
                items: [...cart],
                total: total,
                cost: cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0),
                profit: cart.reduce((sum, item) => sum + ((item.price - item.cost) * item.quantity), 0),
                payment: payment,
                change: payment - total,
                cashier: currentUser,
                cashDrawerAfter: cashDrawerBalance,
                memberNumber: memberNumber || null,
                memberName: memberData ? `${memberData.firstName} ${memberData.lastName}` : null
            };
            
            sales.push(sale);
            saveData();
            
            // Generate receipt
            generateReceipt(sale);
            
            // Reset for next sale
            resetForNextSale();
            
            // Show success message with auto-hide
            showSuccessMessage('ขายสำเร็จ! พร้อมรับรายการถัดไป');
            
            // Refresh product grid to show updated stock
            loadProductGrid();
        }

        function resetForNextSale() {
            // Clear cart
            cart = [];
            updateCart();
            
            // Clear payment fields
            document.getElementById('customerPayment').value = '';
            document.getElementById('changeAmount').textContent = '0.00 บาท';
            document.getElementById('changeAmount').className = 'font-semibold text-green-600';
            
            // Clear member fields
            document.getElementById('memberNumber').value = '';
            document.getElementById('memberInfo').innerHTML = '';
            
            // Focus back to product search
            document.getElementById('productSearch').focus();
        }

        function showSuccessMessage(message) {
            // Create success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        // Barcode Scanner Functions
        function startBarcodeScanner() {
            document.getElementById('barcodeScannerModal').classList.remove('hidden');
            document.getElementById('scannerStatus').textContent = 'กำลังเตรียมกล้อง...';
            
            if (!codeReader) {
                codeReader = new ZXing.BrowserMultiFormatReader();
            }
            
            codeReader.listVideoInputDevices()
                .then((videoInputDevices) => {
                    if (videoInputDevices.length === 0) {
                        document.getElementById('scannerStatus').textContent = 'ไม่พบกล้อง';
                        return;
                    }
                    
                    // Use back camera if available, otherwise use first camera
                    selectedDeviceId = videoInputDevices.find(device => 
                        device.label.toLowerCase().includes('back') || 
                        device.label.toLowerCase().includes('rear')
                    )?.deviceId || videoInputDevices[0].deviceId;
                    
                    document.getElementById('scannerStatus').textContent = 'พร้อมสแกน...';
                    
                    codeReader.decodeFromVideoDevice(selectedDeviceId, 'barcodeScannerVideo', (result, err) => {
                        if (result) {
                            const barcode = result.text;
                            document.getElementById('productSearch').value = barcode;
                            stopBarcodeScanner();
                            addProductToCart(barcode);
                        }
                        if (err && !(err instanceof ZXing.NotFoundException)) {
                            console.error(err);
                        }
                    });
                })
                .catch((err) => {
                    console.error(err);
                    document.getElementById('scannerStatus').textContent = 'ไม่สามารถเข้าถึงกล้องได้';
                });
        }

        function stopBarcodeScanner() {
            if (codeReader) {
                codeReader.reset();
            }
            document.getElementById('barcodeScannerModal').classList.add('hidden');
        }

        function generateReceipt(sale) {
            const receiptContent = document.getElementById('receiptContent');
            
            // Get current date and time in Thai format
            const now = new Date();
            const thaiDate = now.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            const thaiTime = now.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            // Calculate totals
            const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalCost = sale.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
            const totalProfit = sale.total - totalCost;
            
            // Generate receipt number with timestamp
            const receiptNumber = `R${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(sale.id).slice(-6)}`;
            
            receiptContent.innerHTML = `
                <div style="width: 300px; margin: 0 auto; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4;">
                    <!-- Header -->
                    <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">ร้านค้าสหกรณ์นักเรียน</div>
                        <div style="font-size: 14px; font-weight: bold;">ใบเสร็จรับเงิน</div>
                        <div style="font-size: 10px; margin-top: 5px;">RECEIPT</div>
                    </div>
                    
                    <!-- Receipt Info -->
                    <div style="margin-bottom: 15px; font-size: 11px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span>เลขที่ใบเสร็จ:</span>
                            <span style="font-weight: bold;">${receiptNumber}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span>วันที่:</span>
                            <span>${thaiDate}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span>เวลา:</span>
                            <span>${thaiTime}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>แคชเชียร์:</span>
                            <span>${sale.cashier}</span>
                        </div>
                    </div>
                    
                    ${sale.memberNumber ? `
                    <!-- Member Info -->
                    <div style="border: 1px solid #000; padding: 8px; margin-bottom: 15px; background-color: #f9f9f9;">
                        <div style="font-weight: bold; margin-bottom: 5px; text-align: center;">ข้อมูลสมาชิก</div>
                        <div style="font-size: 11px;">
                            <div style="margin-bottom: 2px;">หมายเลข: <span style="font-weight: bold;">${sale.memberNumber}</span></div>
                            <div style="margin-bottom: 2px;">ชื่อ: <span style="font-weight: bold;">${sale.memberName}</span></div>
                            <div>สถานะ: <span style="color: #008000; font-weight: bold;">สมาชิกสหกรณ์</span></div>
                        </div>
                    </div>
                    ` : `
                    <!-- Non-Member Info -->
                    <div style="border: 1px dashed #666; padding: 8px; margin-bottom: 15px; text-align: center;">
                        <div style="font-size: 11px; color: #666;">ลูกค้าทั่วไป (ไม่ใช่สมาชิก)</div>
                    </div>
                    `}
                    
                    <!-- Items Header -->
                    <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                        <div style="display: flex; font-weight: bold; font-size: 11px;">
                            <div style="flex: 2;">รายการสินค้า</div>
                            <div style="flex: 1; text-align: center;">จำนวน</div>
                            <div style="flex: 1; text-align: right;">ราคา</div>
                            <div style="flex: 1; text-align: right;">รวม</div>
                        </div>
                    </div>
                    
                    <!-- Items List -->
                    <div style="margin-bottom: 15px;">
                        ${sale.items.map((item, index) => `
                            <div style="margin-bottom: 8px; font-size: 11px;">
                                <div style="display: flex; align-items: center;">
                                    <div style="flex: 2; font-weight: bold;">${index + 1}. ${item.name}</div>
                                    <div style="flex: 1; text-align: center;">${item.quantity}</div>
                                    <div style="flex: 1; text-align: right;">${item.price.toFixed(2)}</div>
                                    <div style="flex: 1; text-align: right; font-weight: bold;">${(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                                <div style="font-size: 10px; color: #666; margin-left: 5px;">
                                    รหัส: ${item.code} | ${item.quantity} x ${item.price.toFixed(2)} บาท
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Summary -->
                    <div style="border-top: 1px solid #000; padding-top: 10px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px;">
                            <span>จำนวนรายการสินค้า:</span>
                            <span style="font-weight: bold;">${sale.items.length} รายการ</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px;">
                            <span>จำนวนชิ้นทั้งหมด:</span>
                            <span style="font-weight: bold;">${totalItems} ชิ้น</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px;">
                            <span>ต้นทุนรวม:</span>
                            <span>${totalCost.toFixed(2)} บาท</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px;">
                            <span>กำไรจากการขาย:</span>
                            <span style="color: #008000; font-weight: bold;">${totalProfit.toFixed(2)} บาท</span>
                        </div>
                        
                        <div style="border-top: 2px solid #000; padding-top: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; font-weight: bold;">
                                <span>ยอดรวมทั้งสิ้น:</span>
                                <span>${sale.total.toFixed(2)} บาท</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Info -->
                    <div style="border: 2px solid #000; padding: 10px; margin-bottom: 15px; background-color: #f9f9f9;">
                        <div style="text-align: center; font-weight: bold; margin-bottom: 8px; font-size: 12px;">รายละเอียดการชำระเงิน</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
                            <span>เงินที่ลูกค้าจ่าย:</span>
                            <span style="font-weight: bold;">${sale.payment.toFixed(2)} บาท</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
                            <span>ยอดที่ต้องชำระ:</span>
                            <span style="font-weight: bold;">${sale.total.toFixed(2)} บาท</span>
                        </div>
                        <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 5px;">
                            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">
                                <span>เงินทอน:</span>
                                <span style="color: ${sale.change > 0 ? '#008000' : '#000'};">${sale.change.toFixed(2)} บาท</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Info -->
                    <div style="font-size: 10px; margin-bottom: 15px; text-align: center; color: #666;">
                        <div style="margin-bottom: 3px;">วิธีการชำระเงิน: เงินสด</div>
                        <div style="margin-bottom: 3px;">สถานะ: ชำระเงินครบถ้วน</div>
                        <div>เงินในลิ้นชักหลังขาย: ${sale.cashDrawerAfter.toFixed(2)} บาท</div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="border-top: 2px solid #000; padding-top: 10px; text-align: center;">
                        <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">ขอบคุณที่ใช้บริการ</div>
                        <div style="font-size: 10px; margin-bottom: 3px;">กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน</div>
                        <div style="font-size: 10px; margin-bottom: 10px;">สอบถามข้อมูลเพิ่มเติมได้ที่เจ้าหน้าที่</div>
                        
                        <div style="border: 1px solid #000; padding: 8px; margin-top: 10px;">
                            <div style="font-size: 11px; margin-bottom: 5px;">
                                <strong>ข้อมูลติดต่อ:</strong>
                            </div>
                            <div style="font-size: 10px; margin-bottom: 2px;">
                                โรงเรียน: ________________________
                            </div>
                            <div style="font-size: 10px; margin-bottom: 2px;">
                                ที่อยู่: ____________________________
                            </div>
                            <div style="font-size: 10px; margin-bottom: 2px;">
                                โทรศัพท์: _________________________
                            </div>
                            <div style="font-size: 10px;">
                                อีเมล: ____________________________
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px; font-size: 9px; color: #666;">
                            <div>ระบบ POS ร้านค้าสหกรณ์นักเรียน</div>
                            <div>พิมพ์เมื่อ: ${thaiDate} ${thaiTime}</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Show print preview and auto print
            showPrintPreview(receiptContent.innerHTML);
        }

        function showPrintPreview(receiptHTML) {
            // Create print preview modal
            const printModal = document.createElement('div');
            printModal.id = 'printPreviewModal';
            printModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
            printModal.innerHTML = `
                <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-90vh overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold">ตัวอย่างใบเสร็จ</h3>
                        <button onclick="closePrintPreview()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                    </div>
                    
                    <div class="border-2 border-gray-300 p-4 mb-4 bg-white" style="transform: scale(0.9); transform-origin: top;">
                        ${receiptHTML}
                    </div>
                    
                    <div class="flex space-x-4">
                        <button onclick="printReceipt()" class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
                            🖨️ พิมพ์ใบเสร็จ
                        </button>
                        <button onclick="closePrintPreview()" class="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition">
                            ปิด
                        </button>
                    </div>
                    
                    <div class="mt-4 text-sm text-gray-600 text-center">
                        <p>💡 เคล็ดลับ: กด Ctrl+P เพื่อพิมพ์โดยตรง</p>
                        <p>หรือคลิกขวาเลือก "Print" จากเมนู</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(printModal);
            
            // Add keyboard shortcut for printing
            document.addEventListener('keydown', handlePrintShortcut);
        }

        function handlePrintShortcut(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                printReceipt();
            }
            if (e.key === 'Escape') {
                closePrintPreview();
            }
        }

        function printReceipt() {
            window.print();
            closePrintPreview();
        }

        function closePrintPreview() {
            const modal = document.getElementById('printPreviewModal');
            if (modal) {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handlePrintShortcut);
            }
        }

        // Product Management
        function loadProductsTable() {
            const table = document.getElementById('productsTable');
            table.innerHTML = '';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-3">${product.code}</td>
                    <td class="px-4 py-3">${product.name}</td>
                    <td class="px-4 py-3">${getCategoryName(product.category)}</td>
                    <td class="px-4 py-3">${product.cost} บาท</td>
                    <td class="px-4 py-3">${product.price} บาท</td>
                    <td class="px-4 py-3">${product.stock}</td>
                    <td class="px-4 py-3">
                        <button onclick="editProduct('${product.code}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 mr-2">แก้ไข</button>
                        <button onclick="deleteProduct('${product.code}')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">ลบ</button>
                    </td>
                `;
                table.appendChild(row);
            });
        }

        function getCategoryName(category) {
            const categories = {
                'snacks': 'ขนม',
                'drinks': 'เครื่องดื่ม',
                'supplies': 'อุปกรณ์การเรียน'
            };
            return categories[category] || category;
        }

        function showAddProductModal() {
            document.getElementById('addProductModal').classList.remove('hidden');
        }

        function hideAddProductModal() {
            document.getElementById('addProductModal').classList.add('hidden');
            document.getElementById('addProductForm').reset();
            
            // Reset form to add mode
            document.getElementById('productCode').disabled = false;
            document.querySelector('#addProductModal h3').textContent = 'เพิ่มสินค้าใหม่';
            document.querySelector('#addProductForm button[type="submit"]').textContent = 'บันทึก';
            delete document.getElementById('addProductForm').dataset.editMode;
            delete document.getElementById('addProductForm').dataset.originalCode;
        }

        document.getElementById('addProductForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const isEditMode = this.dataset.editMode === 'true';
            const originalCode = this.dataset.originalCode;
            
            const productData = {
                code: document.getElementById('productCode').value.trim(),
                name: document.getElementById('productName').value.trim(),
                category: document.getElementById('productCategory').value,
                cost: parseFloat(document.getElementById('productCost').value),
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value)
            };
            
            // Validate price is higher than cost
            if (productData.price <= productData.cost) {
                alert('ราคาขายต้องสูงกว่าต้นทุน');
                return;
            }
            
            if (isEditMode) {
                // Edit existing product
                const productIndex = products.findIndex(p => p.code === originalCode);
                if (productIndex !== -1) {
                    products[productIndex] = productData;
                    
                    saveData();
                    loadProductsTable();
                    
                    // Refresh stock table if stock section is visible
                    if (!document.getElementById('stockSection').classList.contains('hidden')) {
                        loadStockTable();
                        checkLowStock();
                    }
                    
                    hideAddProductModal();
                    alert('แก้ไขข้อมูลสินค้าสำเร็จ');
                }
            } else {
                // Add new product
                // Check if product code already exists
                if (products.find(p => p.code === productData.code)) {
                    alert('รหัสสินค้านี้มีอยู่แล้ว');
                    return;
                }
                
                products.push(productData);
                saveData();
                loadProductsTable();
                
                // Refresh stock table if stock section is visible
                if (!document.getElementById('stockSection').classList.contains('hidden')) {
                    loadStockTable();
                    checkLowStock();
                }
                
                hideAddProductModal();
                alert('เพิ่มสินค้าสำเร็จ');
            }
        });

        function editProduct(code) {
            const product = products.find(p => p.code === code);
            if (!product) return;
            
            // Fill the form with existing data
            document.getElementById('productCode').value = product.code;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productCost').value = product.cost;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            
            // Disable product code field for editing
            document.getElementById('productCode').disabled = true;
            
            // Change form title and button text
            document.querySelector('#addProductModal h3').textContent = 'แก้ไขข้อมูลสินค้า';
            document.querySelector('#addProductForm button[type="submit"]').textContent = 'บันทึกการแก้ไข';
            
            // Set edit mode flag
            document.getElementById('addProductForm').dataset.editMode = 'true';
            document.getElementById('addProductForm').dataset.originalCode = code;
            
            showAddProductModal();
        }

        function deleteProduct(code) {
            if (confirm('ต้องการลบสินค้านี้หรือไม่?')) {
                products = products.filter(p => p.code !== code);
                saveData();
                loadProductsTable();
                alert('ลบสินค้าสำเร็จ');
            }
        }

        // Stock Management
        function loadStockTable() {
            const table = document.getElementById('stockTable');
            table.innerHTML = '';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-3">${product.code}</td>
                    <td class="px-4 py-3">${product.name}</td>
                    <td class="px-4 py-3">${getCategoryName(product.category)}</td>
                    <td class="px-4 py-3">${product.cost} บาท</td>
                    <td class="px-4 py-3">${product.price} บาท</td>
                    <td class="px-4 py-3 ${product.stock < 10 ? 'text-red-600 font-semibold' : ''}">${product.stock}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center space-x-2">
                            <input type="number" id="restock-${product.code}" class="w-20 px-2 py-1 border border-gray-300 rounded" min="1" placeholder="จำนวน">
                            <button onclick="restockProduct('${product.code}')" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">เติม</button>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-2">
                            <button onclick="editProductFromStock('${product.code}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">แก้ไข</button>
                            <button onclick="adjustStock('${product.code}')" class="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">ปรับสต๊อก</button>
                            <button onclick="deleteProductFromStock('${product.code}')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">ลบ</button>
                        </div>
                    </td>
                `;
                table.appendChild(row);
            });
        }

        function checkLowStock() {
            const lowStockAlert = document.getElementById('lowStockAlert');
            const lowStockProducts = products.filter(p => p.stock < 10);
            
            if (lowStockProducts.length === 0) {
                lowStockAlert.innerHTML = '<p class="text-green-600">สินค้าทั้งหมดมีจำนวนเพียงพอ</p>';
            } else {
                lowStockAlert.innerHTML = lowStockProducts.map(product => 
                    `<div class="flex justify-between items-center py-1">
                        <span>${product.name} (${product.code})</span>
                        <span class="font-semibold">เหลือ ${product.stock} ชิ้น</span>
                    </div>`
                ).join('');
            }
        }

        function restockProduct(code) {
            const input = document.getElementById(`restock-${code}`);
            const quantity = parseInt(input.value);
            
            if (!quantity || quantity <= 0) {
                alert('กรุณาใส่จำนวนที่ถูกต้อง');
                return;
            }
            
            const product = products.find(p => p.code === code);
            if (product) {
                product.stock += quantity;
                saveData();
                loadStockTable();
                checkLowStock();
                input.value = '';
                alert(`เติมสต๊อก ${product.name} จำนวน ${quantity} ชิ้นสำเร็จ`);
            }
        }

        function adjustStock(code) {
            const product = products.find(p => p.code === code);
            if (product) {
                const newStock = prompt(`ปรับสต๊อก ${product.name}\nจำนวนปัจจุบัน: ${product.stock}\nจำนวนใหม่:`, product.stock);
                if (newStock !== null && !isNaN(newStock) && parseInt(newStock) >= 0) {
                    product.stock = parseInt(newStock);
                    saveData();
                    loadStockTable();
                    checkLowStock();
                    alert('ปรับสต๊อกสำเร็จ');
                }
            }
        }

        // Stock page product management functions
        function showAddProductFromStock() {
            showAddProductModal();
        }

        function editProductFromStock(code) {
            editProduct(code);
        }

        function deleteProductFromStock(code) {
            if (confirm('ต้องการลบสินค้านี้หรือไม่?\n\nการลบสินค้าจะส่งผลต่อ:\n- ข้อมูลในระบบขายสินค้า\n- รายงานการขาย\n- สต๊อกสินค้า')) {
                products = products.filter(p => p.code !== code);
                saveData();
                loadStockTable();
                checkLowStock();
                
                // Refresh other sections if they're loaded
                if (document.getElementById('productsSection').style.display !== 'none') {
                    loadProductsTable();
                }
                
                alert('ลบสินค้าสำเร็จ');
            }
        }

        // Members Management
        function loadMembersTable() {
            const table = document.getElementById('membersTable');
            table.innerHTML = '';
            
            members.forEach(member => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-3">${member.number}</td>
                    <td class="px-4 py-3">${member.firstName} ${member.lastName}</td>
                    <td class="px-4 py-3">${member.grade}</td>
                    <td class="px-4 py-3">${member.totalPurchases.toFixed(2)} บาท</td>
                    <td class="px-4 py-3">
                        <button onclick="editMember('${member.number}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 mr-2">แก้ไข</button>
                        <button onclick="deleteMember('${member.number}')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">ลบ</button>
                    </td>
                `;
                table.appendChild(row);
            });
        }

        function loadMembersSummary() {
            const totalMembers = members.length;
            const activeMembers = members.filter(m => m.totalPurchases > 0).length;
            const totalPurchases = members.reduce((sum, m) => sum + m.totalPurchases, 0);
            const averagePurchase = activeMembers > 0 ? totalPurchases / activeMembers : 0;

            document.getElementById('totalMembersCount').textContent = totalMembers;
            document.getElementById('activeMembersCount').textContent = activeMembers;
            document.getElementById('totalMemberPurchases').textContent = totalPurchases.toFixed(2) + ' บาท';
            document.getElementById('averagePurchasePerMember').textContent = averagePurchase.toFixed(2) + ' บาท';

            // Top members
            const topMembers = members
                .filter(m => m.totalPurchases > 0)
                .sort((a, b) => b.totalPurchases - a.totalPurchases)
                .slice(0, 5);

            const topMembersList = document.getElementById('topMembersList');
            topMembersList.innerHTML = topMembers.map((member, index) => 
                `<div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                        <div class="font-medium">${index + 1}. ${member.firstName} ${member.lastName}</div>
                        <div class="text-sm text-gray-600">${member.number} (${member.grade})</div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold">${member.totalPurchases.toFixed(2)} บาท</div>
                        <div class="text-sm text-gray-600">${member.purchaseCount} ครั้ง</div>
                    </div>
                </div>`
            ).join('');
        }

        function showAddMemberModal() {
            document.getElementById('addMemberModal').classList.remove('hidden');
        }

        function hideAddMemberModal() {
            document.getElementById('addMemberModal').classList.add('hidden');
            document.getElementById('addMemberForm').reset();
            
            // Reset form to add mode
            document.getElementById('memberNumberInput').disabled = false;
            document.querySelector('#addMemberModal h3').textContent = 'เพิ่มสมาชิกใหม่';
            document.querySelector('#addMemberForm button[type="submit"]').textContent = 'บันทึก';
            delete document.getElementById('addMemberForm').dataset.editMode;
            delete document.getElementById('addMemberForm').dataset.originalNumber;
        }

        document.getElementById('addMemberForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const isEditMode = this.dataset.editMode === 'true';
            const originalNumber = this.dataset.originalNumber;
            
            const memberData = {
                number: document.getElementById('memberNumberInput').value.trim(),
                firstName: document.getElementById('memberFirstName').value.trim(),
                lastName: document.getElementById('memberLastName').value.trim(),
                grade: document.getElementById('memberGrade').value
            };
            
            if (isEditMode) {
                // Edit existing member
                const memberIndex = members.findIndex(m => m.number === originalNumber);
                if (memberIndex !== -1) {
                    // Keep existing purchase data
                    memberData.totalPurchases = members[memberIndex].totalPurchases;
                    memberData.purchaseCount = members[memberIndex].purchaseCount;
                    members[memberIndex] = memberData;
                    
                    saveData();
                    loadMembersTable();
                    loadMembersSummary();
                    hideAddMemberModal();
                    alert('แก้ไขข้อมูลสมาชิกสำเร็จ');
                }
            } else {
                // Add new member
                // Check if member number already exists
                if (members.find(m => m.number === memberData.number)) {
                    alert('หมายเลขทะเบียนนี้มีอยู่แล้ว');
                    return;
                }
                
                memberData.totalPurchases = 0;
                memberData.purchaseCount = 0;
                
                members.push(memberData);
                saveData();
                loadMembersTable();
                loadMembersSummary();
                hideAddMemberModal();
                alert('เพิ่มสมาชิกสำเร็จ');
            }
        });

        function editMember(memberNumber) {
            const member = members.find(m => m.number === memberNumber);
            if (!member) return;
            
            // Fill the form with existing data
            document.getElementById('memberNumberInput').value = member.number;
            document.getElementById('memberFirstName').value = member.firstName;
            document.getElementById('memberLastName').value = member.lastName;
            document.getElementById('memberGrade').value = member.grade;
            
            // Disable member number field for editing
            document.getElementById('memberNumberInput').disabled = true;
            
            // Change form title and button text
            document.querySelector('#addMemberModal h3').textContent = 'แก้ไขข้อมูลสมาชิก';
            document.querySelector('#addMemberForm button[type="submit"]').textContent = 'บันทึกการแก้ไข';
            
            // Set edit mode flag
            document.getElementById('addMemberForm').dataset.editMode = 'true';
            document.getElementById('addMemberForm').dataset.originalNumber = memberNumber;
            
            showAddMemberModal();
        }

        function deleteMember(memberNumber) {
            if (confirm('ต้องการลบสมาชิกนี้หรือไม่?')) {
                members = members.filter(m => m.number !== memberNumber);
                saveData();
                loadMembersTable();
                loadMembersSummary();
                alert('ลบสมาชิกสำเร็จ');
            }
        }

        function resetMemberPurchases() {
            if (confirm('ต้องการรีเซ็ตยอดซื้อสะสมของสมาชิกทั้งหมดหรือไม่?\n\nการดำเนินการนี้จะลบยอดซื้อสะสมของสมาชิกทุกคนเป็น 0 บาท\nใช้สำหรับเริ่มต้นเทอมใหม่หรือปีการศึกษาใหม่')) {
                members.forEach(member => {
                    member.totalPurchases = 0;
                    member.purchaseCount = 0;
                });
                
                saveData();
                loadMembersTable();
                loadMembersSummary();
                alert('รีเซ็ตยอดซื้อสะสมของสมาชิกทั้งหมดเรียบร้อยแล้ว');
            }
        }

        // Member search functionality
        document.getElementById('memberSearch').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const table = document.getElementById('membersTable');
            const rows = table.getElementsByTagName('tr');
            
            for (let row of rows) {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            }
        });

        // Reports
        function setDefaultDates() {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            
            document.getElementById('startDate').value = startOfMonth.toISOString().split('T')[0];
            document.getElementById('endDate').value = today.toISOString().split('T')[0];
        }

        function generateReport() {
            const startDate = new Date(document.getElementById('startDate').value);
            const endDate = new Date(document.getElementById('endDate').value);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            
            // Filter sales by date range
            const filteredSales = sales.filter(sale => {
                // Parse Thai date format (dd/mm/yyyy) to compare
                const dateParts = sale.date.split('/');
                if (dateParts.length === 3) {
                    // Convert from dd/mm/yyyy to yyyy-mm-dd for proper date parsing
                    const saleDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                    return saleDate >= startDate && saleDate <= endDate;
                }
                return false;
            });
            
            // Calculate totals
            const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
            const totalProfit = filteredSales.reduce((sum, sale) => {
                // Calculate profit from items if not stored
                if (sale.profit !== undefined) {
                    return sum + sale.profit;
                } else if (sale.items) {
                    const saleProfit = sale.items.reduce((itemSum, item) => {
                        const itemProfit = ((item.price || 0) - (item.cost || 0)) * (item.quantity || 0);
                        return itemSum + itemProfit;
                    }, 0);
                    return sum + saleProfit;
                }
                return sum;
            }, 0);
            
            const totalTransactions = filteredSales.length;
            
            // Count unique members who made purchases in the date range
            const uniqueMembers = new Set();
            filteredSales.forEach(sale => {
                if (sale.memberNumber) {
                    uniqueMembers.add(sale.memberNumber);
                }
            });
            const totalMembers = uniqueMembers.size;
            
            // Get current cash drawer balance
            const currentBalance = parseFloat(localStorage.getItem('sessionCashBalance')) || 0;
            
            // Update display
            document.getElementById('totalSales').textContent = totalSales.toFixed(2);
            document.getElementById('totalProfit').textContent = totalProfit.toFixed(2);
            document.getElementById('totalTransactions').textContent = totalTransactions;
            document.getElementById('totalMembers').textContent = totalMembers;
            document.getElementById('cashDrawerBalance').textContent = currentBalance.toFixed(2);
            
            // Calculate top products from filtered sales
            const productSales = {};
            filteredSales.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
                        const code = item.code || item.name; // Fallback to name if no code
                        if (!productSales[code]) {
                            productSales[code] = {
                                name: item.name,
                                quantity: 0,
                                revenue: 0
                            };
                        }
                        productSales[code].quantity += item.quantity || 0;
                        productSales[code].revenue += (item.price || 0) * (item.quantity || 0);
                    });
                }
            });
            
            const topProducts = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);
            
            const topProductsDiv = document.getElementById('topProducts');
            if (topProducts.length === 0) {
                topProductsDiv.innerHTML = '<div class="text-center text-gray-500 py-4">ไม่มีข้อมูลการขายในช่วงเวลาที่เลือก</div>';
            } else {
                topProductsDiv.innerHTML = topProducts.map((product, index) => 
                    `<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                            <div class="font-medium">${index + 1}. ${product.name}</div>
                            <div class="text-sm text-gray-600">ขายได้ ${product.quantity} ชิ้น</div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold">${product.revenue.toFixed(2)} บาท</div>
                        </div>
                    </div>`
                ).join('');
            }
            
            // Update sales history table with filtered data
            loadFilteredSalesHistory(filteredSales);
        }

        function loadSalesHistory() {
            const table = document.getElementById('salesHistory');
            table.innerHTML = '';
            
            // Show latest 20 transactions
            const recentSales = sales.slice(-20).reverse();
            
            recentSales.forEach(sale => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-3">${sale.date}</td>
                    <td class="px-4 py-3">${sale.time}</td>
                    <td class="px-4 py-3">${sale.items.length} รายการ</td>
                    <td class="px-4 py-3">${sale.total.toFixed(2)} บาท</td>
                    <td class="px-4 py-3">${sale.memberNumber ? `${sale.memberNumber} (${sale.memberName})` : 'ไม่ระบุ'}</td>
                    <td class="px-4 py-3">${sale.cashier}</td>
                `;
                table.appendChild(row);
            });
        }

        function loadFilteredSalesHistory(filteredSales) {
            const table = document.getElementById('salesHistory');
            table.innerHTML = '';
            
            if (filteredSales.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                        ไม่มีข้อมูลการขายในช่วงเวลาที่เลือก
                    </td>
                `;
                table.appendChild(row);
                return;
            }
            
            // Sort by date and time (newest first)
            const sortedSales = filteredSales.sort((a, b) => {
                const dateA = new Date(a.date.split('/').reverse().join('-') + ' ' + a.time);
                const dateB = new Date(b.date.split('/').reverse().join('-') + ' ' + b.time);
                return dateB - dateA;
            });
            
            sortedSales.forEach((sale, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50 cursor-pointer';
                row.onclick = () => showSaleDetails(sale);
                row.innerHTML = `
                    <td class="px-4 py-3">${sale.date}</td>
                    <td class="px-4 py-3">${sale.time}</td>
                    <td class="px-4 py-3">
                        <div class="font-medium">${sale.items.length} รายการ</div>
                        <div class="text-xs text-gray-500">${sale.items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="font-medium">${sale.total.toFixed(2)} บาท</div>
                        <div class="text-xs text-green-600">กำไร: ${(sale.profit || 0).toFixed(2)} บาท</div>
                    </td>
                    <td class="px-4 py-3">${sale.memberNumber ? `${sale.memberNumber} (${sale.memberName})` : 'ไม่ระบุ'}</td>
                    <td class="px-4 py-3">${sale.cashier}</td>
                `;
                table.appendChild(row);
            });
            
            // Add summary row at the bottom
            const summaryRow = document.createElement('tr');
            summaryRow.className = 'bg-blue-50 font-semibold border-t-2 border-blue-200';
            const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
            const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
            const totalItems = filteredSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
            
            summaryRow.innerHTML = `
                <td class="px-4 py-3 text-blue-800">สรุปรวม</td>
                <td class="px-4 py-3 text-blue-800">${filteredSales.length} รายการ</td>
                <td class="px-4 py-3 text-blue-800">${totalItems} ชิ้น</td>
                <td class="px-4 py-3 text-blue-800">
                    <div>${totalAmount.toFixed(2)} บาท</div>
                    <div class="text-xs text-green-700">กำไร: ${totalProfit.toFixed(2)} บาท</div>
                </td>
                <td class="px-4 py-3"></td>
                <td class="px-4 py-3"></td>
            `;
            table.appendChild(summaryRow);
        }

        function showSaleDetails(sale) {
            // Create sale details modal
            const modal = document.createElement('div');
            modal.id = 'saleDetailsModal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            
            const itemsHTML = sale.items.map((item, index) => `
                <tr class="border-b">
                    <td class="px-3 py-2">${index + 1}</td>
                    <td class="px-3 py-2">${item.name}</td>
                    <td class="px-3 py-2">${item.code}</td>
                    <td class="px-3 py-2 text-center">${item.quantity}</td>
                    <td class="px-3 py-2 text-right">${item.price.toFixed(2)}</td>
                    <td class="px-3 py-2 text-right font-medium">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `).join('');
            
            modal.innerHTML = `
                <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold">รายละเอียดการขาย</h3>
                        <button onclick="closeSaleDetails()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-6 mb-6">
                        <div class="space-y-3">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h4 class="font-medium text-blue-800 mb-2">ข้อมูลการขาย</h4>
                                <div class="text-sm space-y-1">
                                    <div><span class="text-gray-600">วันที่:</span> <span class="font-medium">${sale.date}</span></div>
                                    <div><span class="text-gray-600">เวลา:</span> <span class="font-medium">${sale.time}</span></div>
                                    <div><span class="text-gray-600">แคชเชียร์:</span> <span class="font-medium">${sale.cashier}</span></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <div class="bg-green-50 p-4 rounded-lg">
                                <h4 class="font-medium text-green-800 mb-2">ข้อมูลลูกค้า</h4>
                                <div class="text-sm space-y-1">
                                    ${sale.memberNumber ? `
                                        <div><span class="text-gray-600">หมายเลขสมาชิก:</span> <span class="font-medium">${sale.memberNumber}</span></div>
                                        <div><span class="text-gray-600">ชื่อ:</span> <span class="font-medium">${sale.memberName}</span></div>
                                        <div><span class="text-green-600 font-medium">✓ สมาชิกสหกรณ์</span></div>
                                    ` : `
                                        <div class="text-gray-600">ลูกค้าทั่วไป (ไม่ใช่สมาชิก)</div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="font-medium mb-3">รายการสินค้า</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-3 py-2 text-left">ลำดับ</th>
                                        <th class="px-3 py-2 text-left">ชื่อสินค้า</th>
                                        <th class="px-3 py-2 text-left">รหัส</th>
                                        <th class="px-3 py-2 text-center">จำนวน</th>
                                        <th class="px-3 py-2 text-right">ราคา</th>
                                        <th class="px-3 py-2 text-right">รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <h4 class="font-medium text-purple-800 mb-3">สรุปการเงิน</h4>
                            <div class="text-sm space-y-2">
                                <div class="flex justify-between">
                                    <span>ยอดรวม:</span>
                                    <span class="font-medium">${sale.total.toFixed(2)} บาท</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>เงินที่รับ:</span>
                                    <span class="font-medium">${sale.payment.toFixed(2)} บาท</span>
                                </div>
                                <div class="flex justify-between border-t pt-2">
                                    <span>เงินทอน:</span>
                                    <span class="font-medium text-green-600">${sale.change.toFixed(2)} บาท</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-orange-50 p-4 rounded-lg">
                            <h4 class="font-medium text-orange-800 mb-3">วิเคราะห์กำไร</h4>
                            <div class="text-sm space-y-2">
                                <div class="flex justify-between">
                                    <span>ต้นทุนรวม:</span>
                                    <span class="font-medium">${sale.cost.toFixed(2)} บาท</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>ยอดขาย:</span>
                                    <span class="font-medium">${sale.total.toFixed(2)} บาท</span>
                                </div>
                                <div class="flex justify-between border-t pt-2">
                                    <span>กำไรสุทธิ:</span>
                                    <span class="font-medium text-green-600">${(sale.profit || 0).toFixed(2)} บาท</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex space-x-4">
                        <button onclick="reprintReceipt('${sale.id}')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                            🖨️ พิมพ์ใบเสร็จซ้ำ
                        </button>
                        <button onclick="closeSaleDetails()" class="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition">
                            ปิด
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }

        function closeSaleDetails() {
            const modal = document.getElementById('saleDetailsModal');
            if (modal) {
                document.body.removeChild(modal);
            }
        }

        function reprintReceipt(saleId) {
            const sale = sales.find(s => s.id == saleId);
            if (sale) {
                generateReceipt(sale);
                closeSaleDetails();
            }
        }

        function resetReportFilter() {
            // Reset to show all sales history without date filter
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            
            // Reset summary to show all-time data
            const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
            const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
            const totalTransactions = sales.length;
            
            const uniqueMembers = new Set();
            sales.forEach(sale => {
                if (sale.memberNumber) {
                    uniqueMembers.add(sale.memberNumber);
                }
            });
            const totalMembers = uniqueMembers.size;
            const currentBalance = parseFloat(localStorage.getItem('sessionCashBalance')) || 0;
            
            // Update display
            document.getElementById('totalSales').textContent = totalSales.toFixed(2);
            document.getElementById('totalProfit').textContent = totalProfit.toFixed(2);
            document.getElementById('totalTransactions').textContent = totalTransactions;
            document.getElementById('totalMembers').textContent = totalMembers;
            document.getElementById('cashDrawerBalance').textContent = currentBalance.toFixed(2);
            
            // Calculate all-time top products
            const productSales = {};
            sales.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
                        const code = item.code || item.name;
                        if (!productSales[code]) {
                            productSales[code] = {
                                name: item.name,
                                quantity: 0,
                                revenue: 0
                            };
                        }
                        productSales[code].quantity += item.quantity || 0;
                        productSales[code].revenue += (item.price || 0) * (item.quantity || 0);
                    });
                }
            });
            
            const topProducts = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);
            
            const topProductsDiv = document.getElementById('topProducts');
            if (topProducts.length === 0) {
                topProductsDiv.innerHTML = '<div class="text-center text-gray-500 py-4">ยังไม่มีข้อมูลการขาย</div>';
            } else {
                topProductsDiv.innerHTML = topProducts.map((product, index) => 
                    `<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                            <div class="font-medium">${index + 1}. ${product.name}</div>
                            <div class="text-sm text-gray-600">ขายได้ ${product.quantity} ชิ้น</div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold">${product.revenue.toFixed(2)} บาท</div>
                        </div>
                    </div>`
                ).join('');
            }
            
            // Reset sales history to show recent transactions
            loadSalesHistory();
        }

        function exportReport() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            let filteredSales;
            let filename;
            
            if (startDate && endDate) {
                // Export filtered data
                filteredSales = sales.filter(sale => {
                    const saleDate = new Date(sale.date.split('/').reverse().join('-'));
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return saleDate >= start && saleDate <= end;
                });
                filename = `sales_report_${startDate}_${endDate}.csv`;
            } else {
                // Export all data
                filteredSales = sales;
                filename = `sales_report_all_time.csv`;
            }
            
            let csv = 'วันที่,เวลา,รายการสินค้า,ยอดรวม,เงินที่รับ,เงินทอน,กำไร,สมาชิก,ชื่อสมาชิก,แคชเชียร์\n';
            
            filteredSales.forEach(sale => {
                const itemsText = sale.items.map(item => `${item.name}(${item.quantity})`).join(';');
                csv += `${sale.date},${sale.time},"${itemsText}",${sale.total},${sale.payment},${sale.change},${(sale.profit || 0).toFixed(2)},${sale.memberNumber || ''},${sale.memberName || ''},${sale.cashier}\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Stock Import/Export Functions
        function exportStockCSV() {
            const headers = ['รหัสสินค้า', 'ชื่อสินค้า', 'หมวดหมู่', 'ต้นทุน', 'ราคาขาย', 'สต๊อกคงเหลือ'];
            let csv = headers.join(',') + '\n';
            
            products.forEach(product => {
                const row = [
                    product.code,
                    `"${product.name}"`,
                    getCategoryName(product.category),
                    product.cost,
                    product.price,
                    product.stock
                ];
                csv += row.join(',') + '\n';
            });
            
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `stock_data_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('ส่งออกข้อมูลสต๊อกเรียบร้อยแล้ว');
        }

        function importStockCSV() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const csv = e.target.result;
                        const lines = csv.split('\n');
                        
                        if (lines.length < 2) {
                            alert('ไฟล์ CSV ไม่มีข้อมูล');
                            return;
                        }
                        
                        // Skip header row
                        const dataLines = lines.slice(1).filter(line => line.trim());
                        let importCount = 0;
                        let updateCount = 0;
                        
                        dataLines.forEach(line => {
                            const columns = parseCSVLine(line);
                            if (columns.length >= 6) {
                                const [code, name, category, cost, price, stock] = columns;
                                
                                // Convert category name back to code
                                const categoryCode = Object.keys({
                                    'snacks': 'ขนม',
                                    'drinks': 'เครื่องดื่ม',
                                    'supplies': 'อุปกรณ์การเรียน'
                                }).find(key => getCategoryName(key) === category.trim()) || 'snacks';
                                
                                const productData = {
                                    code: code.trim(),
                                    name: name.replace(/"/g, '').trim(),
                                    category: categoryCode,
                                    cost: parseFloat(cost) || 0,
                                    price: parseFloat(price) || 0,
                                    stock: parseInt(stock) || 0
                                };
                                
                                // Check if product exists
                                const existingIndex = products.findIndex(p => p.code === productData.code);
                                if (existingIndex !== -1) {
                                    products[existingIndex] = productData;
                                    updateCount++;
                                } else {
                                    products.push(productData);
                                    importCount++;
                                }
                            }
                        });
                        
                        saveData();
                        loadStockTable();
                        checkLowStock();
                        
                        alert(`นำเข้าข้อมูลเรียบร้อย\nสินค้าใหม่: ${importCount} รายการ\nอัปเดต: ${updateCount} รายการ`);
                        
                    } catch (error) {
                        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + error.message);
                    }
                };
                reader.readAsText(file, 'UTF-8');
            };
            input.click();
        }

        // Members Import/Export Functions
        function exportMembersCSV() {
            const headers = ['หมายเลขทะเบียน', 'ชื่อ', 'นามสกุล', 'ชั้น', 'ยอดซื้อสะสม', 'จำนวนครั้งที่ซื้อ'];
            let csv = headers.join(',') + '\n';
            
            members.forEach(member => {
                const row = [
                    member.number,
                    `"${member.firstName}"`,
                    `"${member.lastName}"`,
                    member.grade,
                    member.totalPurchases.toFixed(2),
                    member.purchaseCount || 0
                ];
                csv += row.join(',') + '\n';
            });
            
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `members_data_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('ส่งออกข้อมูลสมาชิกเรียบร้อยแล้ว');
        }

        function importMembersCSV() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const csv = e.target.result;
                        const lines = csv.split('\n');
                        
                        if (lines.length < 2) {
                            alert('ไฟล์ CSV ไม่มีข้อมูล');
                            return;
                        }
                        
                        // Skip header row
                        const dataLines = lines.slice(1).filter(line => line.trim());
                        let importCount = 0;
                        let updateCount = 0;
                        
                        dataLines.forEach(line => {
                            const columns = parseCSVLine(line);
                            if (columns.length >= 4) {
                                const [number, firstName, lastName, grade, totalPurchases, purchaseCount] = columns;
                                
                                const memberData = {
                                    number: number.trim(),
                                    firstName: firstName.replace(/"/g, '').trim(),
                                    lastName: lastName.replace(/"/g, '').trim(),
                                    grade: grade.trim(),
                                    totalPurchases: parseFloat(totalPurchases) || 0,
                                    purchaseCount: parseInt(purchaseCount) || 0
                                };
                                
                                // Check if member exists
                                const existingIndex = members.findIndex(m => m.number === memberData.number);
                                if (existingIndex !== -1) {
                                    members[existingIndex] = memberData;
                                    updateCount++;
                                } else {
                                    members.push(memberData);
                                    importCount++;
                                }
                            }
                        });
                        
                        saveData();
                        loadMembersTable();
                        loadMembersSummary();
                        
                        alert(`นำเข้าข้อมูลเรียบร้อย\nสมาชิกใหม่: ${importCount} คน\nอัปเดต: ${updateCount} คน`);
                        
                    } catch (error) {
                        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + error.message);
                    }
                };
                reader.readAsText(file, 'UTF-8');
            };
            input.click();
        }

        // Helper function to parse CSV line properly
        function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            
            result.push(current);
            return result;
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Load session cash balance if exists and session is still active
            const savedBalance = localStorage.getItem('sessionCashBalance');
            const sessionStart = localStorage.getItem('sessionStartTime');
            
            // Check if session is from today (reset if from previous day)
            if (savedBalance && sessionStart) {
                const sessionDate = new Date(sessionStart);
                const today = new Date();
                
                if (sessionDate.toDateString() === today.toDateString()) {
                    cashDrawerBalance = parseFloat(savedBalance);
                } else {
                    // Clear old session data
                    localStorage.removeItem('sessionCashBalance');
                    localStorage.removeItem('sessionStartTime');
                    cashDrawerBalance = 0;
                }
            }
            
            // Set focus on username field
            document.getElementById('username').focus();
            
            // Allow Enter key to search products
            document.getElementById('productSearch').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addToCart();
                }
            });
            
            // Close scanner modal when clicking outside
            document.getElementById('barcodeScannerModal').addEventListener('click', function(e) {
                if (e.target === this) {
                    stopBarcodeScanner();
                }
            });
            
            // Close add product modal when clicking outside
            document.getElementById('addProductModal').addEventListener('click', function(e) {
                if (e.target === this) {
                    hideAddProductModal();
                }
            });
        });
    