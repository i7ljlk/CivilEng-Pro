document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const calculators = document.querySelectorAll('.calculator-container');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            calculators.forEach(calc => calc.style.display = 'none');
            
            // Add active class to clicked
            item.classList.add('active');
            
            // Show target calculator
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
            
            // Update Title
            pageTitle.textContent = item.textContent.trim();
        });
    });
});

const formatNum = (num) => {
    if (!num && num !== 0) return "0";
    return Number(num.toFixed(3)).toLocaleString();
};

const getVal = (id, def = 0) => {
    const v = document.getElementById(id).value;
    return (v === "" || isNaN(parseFloat(v))) ? def : parseFloat(v);
};

/* --- Brick Calculator --- */
function updateBrickNote() {
    const l = parseFloat(document.getElementById('brick-l').value) || 0;
    const w = parseFloat(document.getElementById('brick-w').value) || 0;
    const h = parseFloat(document.getElementById('brick-h').value) || 0;
    const noteEl = document.getElementById('brick-note-text');
    const mortarGrp = document.getElementById('grp-brick-mortar');
    const wasteGrp = document.getElementById('grp-brick-waste');

    // استبعاد سمك المونة ونسبة الهدر من الشاشة عند الوضع الافتراضي
    if (l === 24 && w === 12 && h === 8) {
        noteEl.innerHTML = "ملاحظة: بالأبعاد الافتراضية يُعتمد <b>450 طابوقة</b> للمتر المكعب (للجدار الحامل والغرفة - قانون الحجم)، و <b>53 طابوقة</b> للمتر المربع (للجدار القاطع - قانون المساحة).";
        mortarGrp.style.display = 'none';
        wasteGrp.style.display = 'none';
        document.getElementById('brick-mortar').value = 1; 
        document.getElementById('brick-waste').value = 5; 
    } else {
        noteEl.innerHTML = "ملاحظة: بما أن الأبعاد تغيرت، ستقوم الحاسبة آلياً بحساب العدد الدقيق واعتماد <b>قانون الحجم</b> (للجدار الحامل والغرفة) أو <b>قانون المساحة</b> (للجدار القاطع).";
        mortarGrp.style.display = 'flex';
        wasteGrp.style.display = 'flex';
    }
}

function toggleBrickSubMode() {
    const mode = document.getElementById('brick-sub-mode').value;
    if (mode === 'wall') {
        document.getElementById('lbl-brick-length').textContent = 'طول الجدار (م)';
        document.getElementById('grp-brick-room-w').style.display = 'none';
    } else {
        document.getElementById('lbl-brick-length').textContent = 'طول الغرفة (م)';
        document.getElementById('grp-brick-room-w').style.display = 'block';
    }
    document.getElementById('brick-result').style.display = 'none';
}

function calculateBrick() {
    const subMode = document.getElementById('brick-sub-mode').value;
    
    const brickL = parseFloat(document.getElementById('brick-l').value) || 24;
    const brickW = parseFloat(document.getElementById('brick-w').value) || 12;
    const brickH = parseFloat(document.getElementById('brick-h').value) || 8;
    const mortar = parseFloat(document.getElementById('brick-mortar').value) || 1;
    const price = parseFloat(document.getElementById('brick-price').value) || 500000;
    
    const wallL = getVal('brick-wall-l', 0);
    const wallH = getVal('brick-wall-h', 0);
    const wallThick = getVal('brick-wall-thick', 0.25);
    const waste = getVal('brick-waste', 5);

    // Calculate Openings Area
    const doorW = parseFloat(document.getElementById('brick-door-w').value) || 0;
    const doorH = parseFloat(document.getElementById('brick-door-h').value) || 0;
    const doorCount = parseFloat(document.getElementById('brick-door-count').value) || 0;
    
    const winW = parseFloat(document.getElementById('brick-win-w').value) || 0;
    const winH = parseFloat(document.getElementById('brick-win-h').value) || 0;
    const winCount = parseFloat(document.getElementById('brick-win-count').value) || 0;

    const openingsExtra = parseFloat(document.getElementById('brick-openings-extra').value) || 0;

    const openingsArea = (doorW * doorH * doorCount) + (winW * winH * winCount) + openingsExtra;

    let wallArea = 0;
    if (subMode === 'wall') {
        wallArea = wallL * wallH;
    } else {
        const roomW = parseFloat(document.getElementById('brick-room-w').value) || 0;
        wallArea = 2 * (wallL + roomW) * wallH;
    }

    const netArea = wallArea - openingsArea;
    if (netArea < 0) {
        alert("مساحة الفتحات أكبر من مساحة الجدران!");
        return;
    }
    if (wallArea <= 0) return;

    let bricksPerSqm = 0;
    let bricksPerCubicM = 0;

    // If Default Dimensions, Force User Constants
    if (brickL === 24 && brickW === 12 && brickH === 8) {
        bricksPerSqm = 53;
        bricksPerCubicM = 450;
    } else {
        // Calculate dynamically if inputs changed
        const L_m = (brickL + mortar) / 100;
        const W_m = (brickW + mortar) / 100;
        const H_m = (brickH + mortar) / 100;
        
        bricksPerSqm = 1 / (L_m * H_m);
        bricksPerCubicM = 1 / (L_m * W_m * H_m);
    }

    let rawBricks = 0;
    let methodUsed = "";
    const isDefault = (brickL === 24 && brickW === 12 && brickH === 8);

    if (subMode === 'wall' && wallThick < 0.20) {
        // Partition Wall (12cm) -> Area Law
        rawBricks = netArea * bricksPerSqm;
        methodUsed = `قانون المساحة (جدار قاطع)<br><small style="color: #666; font-size: 0.9em; margin-top: 5px; display: block;">تم اعتماد معدل ${isDefault ? '53' : Math.ceil(bricksPerSqm)} طابوقة لكل 1 متر مربع بناءً على الأبعاد${isDefault ? ' الافتراضية' : ' المدخلة'}</small>`;
    } else {
        // Load-bearing Wall or Room -> Volume Law
        const netVolume = netArea * wallThick;
        rawBricks = netVolume * bricksPerCubicM;
        const modeText = subMode === 'room' ? 'غرفة كاملة' : 'جدار حامل';
        methodUsed = `قانون الحجم (${modeText})<br><small style="color: #666; font-size: 0.9em; margin-top: 5px; display: block;">تم اعتماد معدل ${isDefault ? '450' : Math.ceil(bricksPerCubicM)} طابوقة لكل 1 متر مكعب بناءً على الأبعاد${isDefault ? ' الافتراضية' : ' المدخلة'}</small>`;
    }

    const appliedWaste = isDefault ? 0 : waste;
    const wasteFactor = 1 + (appliedWaste / 100);
    let totalBricks = Math.ceil(rawBricks * wasteFactor);

    // Price is per 4000 bricks now!
    const totalCost = (totalBricks / 4000) * price;

    let html = `
        <div class="result-item" style="grid-column: 1 / -1; background: #e3f2fd; border-right: 4px solid var(--primary);">
            <h5>طريقة الحساب المعتمدة</h5>
            <span class="res-value" style="font-size: 1.2rem; color: var(--primary);">${methodUsed}</span>
        </div>
        <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
            <h5 style="color: white; opacity: 0.9;">عدد الطابوق الإجمالي المطلوب</h5>
            <span class="res-value" style="color: white;">${formatNum(totalBricks)}</span>
            <span class="res-unit" style="color: white;">طابوقة</span>
        </div>
        <div class="result-item">
            <h5>مساحة الفتحات (أبواب/نوافذ)</h5>
            <span class="res-value">${formatNum(openingsArea)}</span>
            <span class="res-unit">م²</span>
        </div>
        <div class="result-item">
            <h5>المساحة الصافية</h5>
            <span class="res-value">${formatNum(netArea)}</span>
            <span class="res-unit">م²</span>
        </div>
    `;

    if (price > 0) {
        html += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h5 style="color: red;">التكلفة التقديرية (بناءً على سعر الـ 4000 طابوقة)</h5>
                <span class="res-value" style="color: red;">${formatNum(totalCost)}</span>
                <span class="res-unit" style="color: red;">دينار</span>
            </div>
        `;
    }

    document.getElementById('brick-result-grid').innerHTML = html;
    document.getElementById('brick-result').style.display = 'block';
    saveToHistory("حساب الطابوق", html);
}

/* --- Ceramic Calculator --- */
function toggleCeramicSubMode() {
    const subMode = document.getElementById('ceramic-sub-mode').value;
    const grpArea = document.getElementById('grp-ceramic-area');
    const grpWallL = document.getElementById('grp-ceramic-wall-l');
    const grpRoomW = document.getElementById('grp-ceramic-room-w');
    const grpWallH = document.getElementById('grp-ceramic-wall-h');
    const grpOpenings = document.getElementById('grp-ceramic-openings');
    const lblLength = document.getElementById('lbl-ceramic-length');

    if (subMode === 'area') {
        grpArea.style.display = 'flex';
        grpWallL.style.display = 'none';
        grpRoomW.style.display = 'none';
        grpWallH.style.display = 'none';
        grpOpenings.style.display = 'none';
    } else if (subMode === 'wall') {
        grpArea.style.display = 'none';
        grpWallL.style.display = 'flex';
        lblLength.textContent = 'طول الجدار (م)';
        grpRoomW.style.display = 'none';
        grpWallH.style.display = 'flex';
        grpOpenings.style.display = 'block';
    } else if (subMode === 'room') {
        grpArea.style.display = 'none';
        grpWallL.style.display = 'flex';
        lblLength.textContent = 'طول الغرفة (م)';
        grpRoomW.style.display = 'flex';
        grpWallH.style.display = 'flex';
        grpOpenings.style.display = 'block';
    }
    document.getElementById('ceramic-result').style.display = 'none';
}

function calculateCeramic() {
    const subMode = document.getElementById('ceramic-sub-mode').value;
    
    let area = 0;
    let openingsArea = 0;

    if (subMode === 'area') {
        area = parseFloat(document.getElementById('ceramic-area').value) || 0;
    } else {
        const wallH = parseFloat(document.getElementById('ceramic-wall-h').value) || 0;
        const wallL = parseFloat(document.getElementById('ceramic-wall-l').value) || 0;
        
        let grossArea = 0;
        if (subMode === 'wall') {
            grossArea = wallL * wallH;
        } else if (subMode === 'room') {
            const roomW = parseFloat(document.getElementById('ceramic-room-w').value) || 0;
            // Floor area + walls area
            grossArea = (wallL * roomW) + (2 * (wallL + roomW) * wallH);
        }

        const doorW = parseFloat(document.getElementById('ceramic-door-w').value) || 0;
        const doorH = parseFloat(document.getElementById('ceramic-door-h').value) || 0;
        const doorCount = parseFloat(document.getElementById('ceramic-door-count').value) || 0;
        
        const winW = parseFloat(document.getElementById('ceramic-win-w').value) || 0;
        const winH = parseFloat(document.getElementById('ceramic-win-h').value) || 0;
        const winCount = parseFloat(document.getElementById('ceramic-win-count').value) || 0;
        const extraOp = parseFloat(document.getElementById('ceramic-openings-extra').value) || 0;

        openingsArea = (doorW * doorH * doorCount) + (winW * winH * winCount) + extraOp;
        area = grossArea - openingsArea;

        if (area < 0) {
            alert("مساحة الفتحات أكبر من المساحة الكلية!");
            return;
        }
    }

    const l = parseFloat(document.getElementById('ceramic-l').value) || 0;
    const w = parseFloat(document.getElementById('ceramic-w').value) || 0;
    const tilesPerBox = parseInt(document.getElementById('ceramic-box-count').value) || 4;
    const price = getVal('ceramic-price', 0);
    const waste = getVal('ceramic-waste', 10);
    const jointMm = getVal('ceramic-joint', 2);

    if (l <= 0 || w <= 0 || area <= 0) {
        alert("يرجى إدخال أبعاد صحيحة والتأكد من وجود مساحة صافية موجبة.");
        return;
    }

    const jointCm = jointMm / 10;
    const tileArea = (l + jointCm) * (w + jointCm);
    const requiredAreaCm = area * 10000;

    const tilesNeeded = Math.ceil(requiredAreaCm / tileArea);
    const totalTiles = Math.ceil(tilesNeeded * (1 + waste / 100));
    const totalBoxes = Math.ceil(totalTiles / tilesPerBox);
    const totalCost = totalBoxes * price;

    let html = ``;
    if (subMode !== 'area') {
        html += `
            <div class="result-item"><h5>مساحة الفتحات المخصومة</h5><span class="res-value">${formatNum(openingsArea)}</span><span class="res-unit">م²</span></div>
            <div class="result-item"><h5>المساحة الصافية للسيراميك</h5><span class="res-value">${formatNum(area)}</span><span class="res-unit">م²</span></div>
        `;
    }

    html += `
        <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
            <h5 style="color: white; opacity: 0.9;">عدد البلاطات المطلوبة (مع الهدر)</h5>
            <span class="res-value" style="color: white;">${formatNum(totalTiles)}</span>
            <span class="res-unit" style="color: white;">بلاطة</span>
        </div>
        <div class="result-item">
            <h5>عدد العلب المطلوبة</h5>
            <span class="res-value">${formatNum(totalBoxes)}</span>
            <span class="res-unit">علبة</span>
        </div>
    `;

    if (price > 0) {
        html += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h5 style="color: red;">التكلفة الإجمالية (بناءً على سعر العلبة)</h5>
                <span class="res-value" style="color: red;">${formatNum(totalCost)}</span>
                <span class="res-unit" style="color: red;">دينار</span>
            </div>
        `;
    }

    document.getElementById('ceramic-result-grid').innerHTML = html;
    document.getElementById('ceramic-result').style.display = 'block';
    saveToHistory("حساب السيراميك", html);
}

/* --- Plaster Calculator --- */
function togglePlasterMaterial() {
    const mat = document.getElementById('plaster-material').value;
    if (mat === 'labakh') {
        document.getElementById('plaster-material-title').textContent = 'تكوين اللبخ (سمنت ورمل):';
        document.getElementById('grp-plaster-labakh').style.display = 'grid';
        document.getElementById('grp-plaster-gypsum').style.display = 'none';
    } else {
        document.getElementById('plaster-material-title').textContent = 'تكوين الجص:';
        document.getElementById('grp-plaster-labakh').style.display = 'none';
        document.getElementById('grp-plaster-gypsum').style.display = 'grid';
    }
    document.getElementById('plaster-result').style.display = 'none';
}

function togglePlasterMode() {
    const mode = document.getElementById('plaster-sub-mode').value;
    if (mode === 'wall') {
        document.getElementById('grp-plaster-wall-len').style.display = 'flex';
        document.getElementById('grp-plaster-room-len').style.display = 'none';
        document.getElementById('grp-plaster-room-width').style.display = 'none';
    } else {
        document.getElementById('grp-plaster-wall-len').style.display = 'none';
        document.getElementById('grp-plaster-room-len').style.display = 'flex';
        document.getElementById('grp-plaster-room-width').style.display = 'flex';
    }
    document.getElementById('plaster-result').style.display = 'none';
}

function calculatePlaster() {
    const material = document.getElementById('plaster-material').value;
    const subMode = document.getElementById('plaster-sub-mode').value;
    const wallH = parseFloat(document.getElementById('plaster-wall-height').value) || 0;
    const price = getVal('plaster-price', 0);
    const waste = getVal('plaster-waste', 5);
    
    // Auto-calculate Openings and Reveals
    const wallThick = getVal('plaster-wall-thick', 0.25);
    const doorW = parseFloat(document.getElementById('plaster-door-w').value) || 0;
    const doorH = parseFloat(document.getElementById('plaster-door-h').value) || 0;
    const doorCount = parseFloat(document.getElementById('plaster-door-count').value) || 0;
    
    const winW = parseFloat(document.getElementById('plaster-win-w').value) || 0;
    const winH = parseFloat(document.getElementById('plaster-win-h').value) || 0;
    const winCount = parseFloat(document.getElementById('plaster-win-count').value) || 0;

    const opExtra = parseFloat(document.getElementById('plaster-openings-extra').value) || 0;
    const revExtra = parseFloat(document.getElementById('plaster-reveals-extra').value) || 0;

    let openingsArea = (doorW * doorH * doorCount) + (winW * winH * winCount) + opExtra;
    let revealsArea = revExtra;

    if (wallThick > 0) {
        // Calculate reveals automatically for all openings
        const doorPerimeter = (2 * doorH) + doorW; // الباب: الطول مرتين والعرض مرة واحدة
        const winPerimeter = (2 * winH) + (2 * winW); // الشباك: المحيط الكامل
        revealsArea += (doorPerimeter * wallThick * doorCount) + (winPerimeter * wallThick * winCount);
    }

    if (wallH <= 0) {
        alert("يرجى إدخال الارتفاع بشكل صحيح.");
        return;
    }

    let grossArea = 0;
    let roomPerimeter = 0;
    if (subMode === 'wall') {
        const wallL = parseFloat(document.getElementById('plaster-wall-len').value) || 0;
        grossArea = wallL * wallH;
    } else {
        const roomL = parseFloat(document.getElementById('plaster-room-len').value) || 0;
        const roomW = parseFloat(document.getElementById('plaster-room-width').value) || 0;
        roomPerimeter = 2 * (roomL + roomW);
        
        if (material === 'gypsum') {
            grossArea = roomPerimeter * wallH; // Walls only
        } else {
            grossArea = (roomL * roomW) + (roomPerimeter * wallH); // Ceiling + Walls
        }
    }

    let netArea = grossArea + revealsArea - openingsArea;
    if (netArea <= 0) {
        alert("مساحة الفتحات المخصومة أكبر من المساحة الكلية!");
        return;
    }

    const areaWithWaste = netArea * (1 + (waste / 100));
    const totalCost = netArea * price;
    
    let html = ``;
    if (subMode === 'room') {
        html += `<div class="result-item"><h5>محيط الغرفة</h5><span class="res-value">${formatNum(roomPerimeter)}</span><span class="res-unit">متر</span></div>`;
    }

    html += `
        <div class="result-item"><h5>المساحة الكلية (${material === 'gypsum' ? 'جدران' : 'سقف+جدران'})</h5><span class="res-value">${formatNum(grossArea)}</span><span class="res-unit">م²</span></div>
        <div class="result-item"><h5>خصم الفتحات</h5><span class="res-value">${formatNum(openingsArea)}</span><span class="res-unit">م²</span></div>
        <div class="result-item"><h5>إضافة الجوانب/الكتافات</h5><span class="res-value">${formatNum(revealsArea)}</span><span class="res-unit">م²</span></div>
    `;

    if (material === 'labakh') {
        // Labakh primary: Net Area
        html += `
            <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
                <h5 style="color: white; opacity: 0.9;">المساحة الصافية</h5>
                <span class="res-value" style="color: white;">${formatNum(netArea)}</span>
                <span class="res-unit" style="color: white;">م²</span>
            </div>
            <div class="result-item"><h5>المساحة مع الهدر (${waste}%)</h5><span class="res-value">${formatNum(areaWithWaste)}</span><span class="res-unit">م²</span></div>
        `;

        const thick = parseFloat(document.getElementById('plaster-thick').value) || 0.02;
        const rC = parseFloat(document.getElementById('plaster-cement-ratio').value) || 1;
        const rS = parseFloat(document.getElementById('plaster-sand-ratio').value) || 3;
        
        if (thick > 0 && (rC + rS) > 0) {
            const mortarVol = areaWithWaste * thick;
            const s = mortarVol / (0.75 * (rC + rS));
            const cementVol = s * rC;
            const sandVol = s * rS;
            const bags = Math.ceil(cementVol / 0.035714); // 50 / 1400

            html += `
                <div class="result-item"><h5>الأسمنت المطلوب</h5><span class="res-value">${formatNum(bags)}</span><span class="res-unit">كيس (50كجم)</span></div>
                <div class="result-item"><h5>الرمل المطلوب</h5><span class="res-value">${formatNum(sandVol, 3)}</span><span class="res-unit">م³</span></div>
            `;
        }
    } else {
        // Gypsum primary: Weight in Ton
        const thick = parseFloat(document.getElementById('gypsum-thick').value) || 0.02;
        const density = parseFloat(document.getElementById('gypsum-density').value) || 1000;
        const loss = parseFloat(document.getElementById('gypsum-loss').value) || 10;
        
        if (thick > 0 && density > 0) {
            const factor = (100 - loss) > 0 ? (100 / (100 - loss)) : 1.0;
            const weightPerM2 = (thick * density) * factor;
            const weightKg = weightPerM2 * areaWithWaste;
            const ton = weightKg / 1000;
            
            html += `
                <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
                    <h5 style="color: white; opacity: 0.9;">الوزن الكلي المطلوب (مع هدر ${waste}%)</h5>
                    <span class="res-value" style="color: white;">${formatNum(ton, 3)}</span>
                    <span class="res-unit" style="color: white;">طن جص</span>
                </div>
                <div class="result-item"><h5>المساحة الصافية</h5><span class="res-value">${formatNum(netArea)}</span><span class="res-unit">م²</span></div>
                <div class="result-item"><h5>الوزن الكلي بالكغم</h5><span class="res-value">${formatNum(weightKg, 1)}</span><span class="res-unit">كغم</span></div>
                <div class="result-item"><h5>معامل التعويض</h5><span class="res-value">${formatNum(factor, 3)}</span><span class="res-unit">--</span></div>
                <div class="result-item"><h5>وزن المتر المربع (صافي)</h5><span class="res-value">${formatNum(thick * density)}</span><span class="res-unit">كغم</span></div>
                <div class="result-item"><h5>الوزن الكلي بالكغم</h5><span class="res-value">${formatNum(weightKg, 1)}</span><span class="res-unit">كغم</span></div>
            `;
        }
    }

    if (price > 0) {
        html += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h5 style="color: red;">التكلفة الكلية للعمل</h5>
                <span class="res-value" style="color: red;">${formatNum(totalCost)}</span>
                <span class="res-unit" style="color: red;">دينار</span>
            </div>
        `;
    }

    document.getElementById('plaster-result-grid').innerHTML = html;
    document.getElementById('plaster-result').style.display = 'block';
    saveToHistory("حساب البياض", html);
}

/* --- Excavation Calculator --- */
let excWalls = [];

function toggleExcavationMode() {
    const mode = document.getElementById('exc-mode').value;
    document.getElementById('exc-normal-mode').style.display = (mode === 'normal') ? 'grid' : 'none';
    document.getElementById('exc-strip-mode').style.display = (mode === 'strip') ? 'block' : 'none';
    document.getElementById('exc-w-shared').style.display = (mode === 'strip') ? 'block' : 'none';
    document.getElementById('excavation-result').style.display = 'none';
}

function addExcWall() {
    const l = parseFloat(document.getElementById('exc-wall-l').value) || 0;
    const count = parseInt(document.getElementById('exc-wall-count').value) || 1;
    const dir = document.getElementById('exc-wall-dir').value;

    if (l <= 0 || count <= 0) {
        alert("يرجى إدخال طول جدار وعدد صحيح");
        return;
    }

    excWalls.push({ l, count, dir });
    document.getElementById('exc-wall-l').value = '';
    document.getElementById('exc-wall-count').value = 1;
    renderExcWalls();
}

function removeExcWall(index) {
    excWalls.splice(index, 1);
    renderExcWalls();
}

function renderExcWalls() {
    const list = document.getElementById('exc-wall-list');
    let html = '';
    excWalls.forEach((wall, i) => {
        html += `
            <div class="opening-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 8px; margin-bottom: 5px; border-right: 4px solid ${wall.dir === 'h' ? '#3B82F6' : '#10B981'};">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <span style="font-weight: bold; color: ${wall.dir === 'h' ? '#3B82F6' : '#10B981'};">${wall.dir === 'h' ? 'أفقي' : 'عمودي'}</span>
                    <span>الطول: ${wall.l} م</span>
                    <span>العدد: ${wall.count}</span>
                </div>
                <button onclick="removeExcWall(${i})" style="background: none; border: none; color: #EF4444; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
    list.innerHTML = html;
}

function calculateExcavation() {
    const mode = document.getElementById('exc-mode').value;
    const d = getVal('exc-depth', 0);
    const price = getVal('exc-price', 0);
    const waste = getVal('exc-waste', 5);

    if (d <= 0) {
        alert("يرجى إدخال عمق الحفر بشكل صحيح");
        return;
    }

    let vol = 0;
    let extraHtml = '';

    if (mode === 'normal') {
        const l = parseFloat(document.getElementById('exc-length').value) || 0;
        const w = parseFloat(document.getElementById('exc-width').value) || 0;
        
        if (l <= 0 || w <= 0) {
            alert("يرجى إدخال الطول والعرض بشكل صحيح");
            return;
        }
        
        vol = l * w * d;
    } else {
        const w = parseFloat(document.getElementById('exc-width-shared').value) || 0;
        if (w <= 0) {
            alert("يرجى إدخال عرض الأساس بشكل صحيح");
            return;
        }

        if (excWalls.length === 0) {
            alert("يرجى إضافة جدار واحد على الأقل للأساس الشريطي");
            return;
        }

        let totalHorizLength = 0;
        let totalVertLength = 0;

        excWalls.forEach(wall => {
            if (wall.dir === 'h') {
                totalHorizLength += (wall.l + w) * wall.count;
            } else {
                totalVertLength += (wall.l - w) * wall.count;
            }
        });

        const grandTotalLength = totalHorizLength + totalVertLength;
        
        if (grandTotalLength <= 0) {
            alert("لم يتم إدخال أطوال جدران صحيحة!");
            return;
        }

        vol = grandTotalLength * w * d;
        extraHtml = `
            <div class="result-item"><h5>مجموع الأطوال الأفقية الفعّالة</h5><span class="res-value">${formatNum(totalHorizLength)}</span><span class="res-unit">م</span></div>
            <div class="result-item"><h5>مجموع الأطوال العمودية الفعّالة</h5><span class="res-value">${formatNum(totalVertLength)}</span><span class="res-unit">م</span></div>
            <div class="result-item" style="grid-column: 1 / -1; background: #f8fafc; border-right: 3px solid var(--primary);"><h5>الطول الإجمالي الفعّال الصافي</h5><span class="res-value">${formatNum(grandTotalLength)}</span><span class="res-unit">م</span></div>
        `;
    }

    const totalVolWithWaste = vol * (1 + (waste / 100));
    const totalCost = vol * price;

    let html = extraHtml + `
        <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
            <h5 style="color: white; opacity: 0.9;">حجم الحفريات الصافي</h5>
            <span class="res-value" style="color: white;">${formatNum(vol)}</span>
            <span class="res-unit" style="color: white;">م³</span>
        </div>
        <div class="result-item">
            <h5>الحجم مع الهدر للتخمين</h5>
            <span class="res-value">${formatNum(totalVolWithWaste)}</span>
            <span class="res-unit">م³</span>
        </div>
    `;

    if (price > 0) {
        html += `
            <div class="result-item">
                <h5 style="color: red;">التكلفة الإجمالية للحفر/الردم</h5>
                <span class="res-value" style="color: red;">${formatNum(totalCost)}</span>
                <span class="res-unit" style="color: red;">دينار</span>
            </div>
        `;
    }

    document.getElementById('excavation-result-grid').innerHTML = html;
    document.getElementById('excavation-result').style.display = 'block';
    saveToHistory("حساب الحفريات", html);
}

/* --- Steel Calculator (Comprehensive) --- */
function toggleSteelModes() {
    const mode = document.getElementById('steel-mode').value;
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById('steel-mode-' + i);
        if (el) el.style.display = (i == mode) ? 'block' : 'none';
    }
    document.getElementById('steel-comp-result').style.display = 'none';
}

function getBarsPerTon(d) {
    switch (parseInt(d)) {
        case 6: return 222;
        case 8: return 210;
        case 10: return 135;
        case 12: return 94;
        case 14: return 68;
        case 16: return 53;
        case 18: return 42;
        case 20: return 34;
        case 22: return 28;
        case 25: return 21;
        default: return 0;
    }
}

function calculateSteelComprehensive() {
    const mode = document.getElementById('steel-mode').value;
    let resultWeight = 0;
    let totalBarsCount = 0;
    let wastePercent = 0;
    let gridHtml = '';

    if (mode === '1') {
        const L = parseFloat(document.getElementById('st1-length').value) || 0;
        const W = parseFloat(document.getElementById('st1-width').value) || 0;
        const spacing = parseFloat(document.getElementById('st1-spacing').value) || 0;
        const cover = parseFloat(document.getElementById('st1-cover').value) || 0;
        const d = parseFloat(document.getElementById('st1-diameter').value) || 0;
        const layers = parseFloat(document.getElementById('st1-layers').value) || 0;
        const manualBarsPerTon = getVal('st1-bars-per-ton', 0);
        wastePercent = getVal('st1-waste', 5);
        const overlapCoeff = parseFloat(document.getElementById('st1-overlap').value) || 60;

        if (spacing === 0) return;

        const countShort = Math.ceil(L / spacing) + 1;
        const lengthShortTotal = countShort * (W - (2 * cover));
        const stdBarsShort = Math.ceil(lengthShortTotal / 12);

        const countLong = Math.ceil(W / spacing) + 1;
        const lengthLongTotal = countLong * (L - (2 * cover));
        const stdBarsLong = Math.ceil(lengthLongTotal / 12);

        const lapLen = (overlapCoeff * d) / 1000;
        const lapTotalLen = countLong * lapLen;
        const slabOverlapStdBars = Math.ceil(lapTotalLen / 12);

        const barsPerTon = manualBarsPerTon > 0 ? manualBarsPerTon : getBarsPerTon(d);
        const weightPerMeter = (d * d) / 162;
        let slabOverlapWeightVal = 0, weightShort = 0, weightLong = 0;

        if (barsPerTon > 0) {
            slabOverlapWeightVal = slabOverlapStdBars / barsPerTon;
            weightShort = stdBarsShort / barsPerTon;
            weightLong = stdBarsLong / barsPerTon;
            resultWeight = (weightShort + weightLong + slabOverlapWeightVal) * layers;
            totalBarsCount = (stdBarsShort + stdBarsLong + slabOverlapStdBars) * layers;
        } else {
            slabOverlapWeightVal = (lapTotalLen * weightPerMeter) / 1000;
            weightShort = (lengthShortTotal * weightPerMeter) / 1000;
            weightLong = (lengthLongTotal * weightPerMeter) / 1000;
            resultWeight = (weightShort + weightLong + slabOverlapWeightVal) * layers;
            totalBarsCount = Math.ceil((lengthShortTotal + lengthLongTotal + lapTotalLen) / 12) * layers;
        }

        gridHtml += `
            <div class="result-item"><h5>الشيش الستندر - قصير</h5><span class="res-value">${stdBarsShort}</span><span class="res-unit">شيش</span></div>
            <div class="result-item"><h5>الشيش الستندر - طويل</h5><span class="res-value">${stdBarsLong}</span><span class="res-unit">شيش</span></div>
        `;
    } 
    else if (mode === '2') {
        const length = parseFloat(document.getElementById('st2-length').value) || 0;
        const count1 = getVal('st2-count1', 0);
        const d = getVal('st2-dia1', 0);
        const useDual = document.getElementById('st2-use-dual').checked;
        const manualBarsPerTon = getVal('st2-bars-per-ton', 0);
        wastePercent = getVal('st2-waste', 5);

        const weightPerMeter = (d * d) / 162;
        const totalLen1 = length * count1;
        const stdBarsLong = Math.ceil(totalLen1 / 12);
        const barsPerTon1 = manualBarsPerTon > 0 ? manualBarsPerTon : getBarsPerTon(d);

        let beamWeightVal = barsPerTon1 > 0 ? (stdBarsLong / barsPerTon1) : (totalLen1 * weightPerMeter / 1000);
        let beamTotalStdBars = stdBarsLong;

        if (useDual) {
            const dDual = parseFloat(document.getElementById('st2-dia2').value) || 0;
            const count2 = parseInt(document.getElementById('st2-count2').value) || 0;
            const totalLen2 = length * count2;
            const stdBarsDual = Math.ceil(totalLen2 / 12);
            const barsPerTon2 = manualBarsPerTon > 0 ? manualBarsPerTon : getBarsPerTon(dDual);
            
            let weight2 = barsPerTon2 > 0 ? (stdBarsDual / barsPerTon2) : (totalLen2 * ((dDual * dDual) / 162) / 1000);
            beamWeightVal += weight2;
            beamTotalStdBars += stdBarsDual;
        }

        const overlapCoeff = parseFloat(document.getElementById('st2-overlap').value) || 60;
        const stairCount = parseInt(document.getElementById('st2-stair-count').value) || 0;
        const stairLapLenVal = (overlapCoeff * d) / 1000;
        const totalLenAshOneSide = stairCount * stairLapLenVal;
        const stdBarsAshOneSide = Math.ceil(totalLenAshOneSide / 12);
        
        let stairWeightVal = barsPerTon1 > 0 ? (stdBarsAshOneSide / barsPerTon1) * 2 : (totalLenAshOneSide * 2 * weightPerMeter / 1000);

        const sSpacing = parseFloat(document.getElementById('st2-stirrup-spacing').value) || 0;
        const sDiam = parseFloat(document.getElementById('st2-stirrup-dia').value) || 0;
        const bWidth = parseFloat(document.getElementById('st2-width').value) || 0;
        const bHeight = parseFloat(document.getElementById('st2-height').value) || 0;
        const sCover = parseFloat(document.getElementById('st2-cover').value) || 0;
        const sHook = parseFloat(document.getElementById('st2-hook').value) || 0;

        let sStdBars = 0;
        let stirrupsWeight = 0;
        if (sSpacing > 0) {
            const stirrupsPieceCount = Math.ceil(length / sSpacing);
            const stirrupPerimeterVal = 2 * ((bWidth - 2 * sCover) + (bHeight - 2 * sCover)) + (2 * sHook);
            const sTotalLen = stirrupsPieceCount * stirrupPerimeterVal;
            sStdBars = Math.ceil(sTotalLen / 12);

            const sBarsPerTon = getBarsPerTon(sDiam);
            if (sBarsPerTon > 0) {
                stirrupsWeight = sStdBars / sBarsPerTon;
            } else {
                stirrupsWeight = sTotalLen * ((sDiam * sDiam) / 162) / 1000;
            }
        }

        resultWeight = beamWeightVal + stairWeightVal + stirrupsWeight;
        totalBarsCount = beamTotalStdBars + stdBarsAshOneSide + Math.floor(sStdBars);
    }
    else if (mode === '3') {
        const dol = parseFloat(document.getElementById('st3-dol').value) || 0;
        const slab = parseFloat(document.getElementById('st3-slab').value) || 0;
        const floor = parseFloat(document.getElementById('st3-floor').value) || 0;
        const height = dol + slab + floor;
        const count = parseInt(document.getElementById('st3-count').value) || 0;
        const numColumns = parseInt(document.getElementById('st3-cols').value) || 1;
        const d = parseFloat(document.getElementById('st3-dia').value) || 0;
        const manualWM = parseFloat(document.getElementById('st3-weight-per-m').value) || 0;

        const weightPerMeter = (d * d) / 162;
        const effectiveW = manualWM > 0 ? manualWM : weightPerMeter;

        const columnTotalBarsCount = count * numColumns;
        const totalBarsLength = height * columnTotalBarsCount;
        
        resultWeight = (totalBarsLength * effectiveW) / 1000;
        totalBarsCount = columnTotalBarsCount;
        wastePercent = 0;
    }
    else if (mode === '4') {
        const totalLen = parseFloat(document.getElementById('st4-length').value) || 0;
        const spacing = parseFloat(document.getElementById('st4-spacing').value) || 0;
        const b = parseFloat(document.getElementById('st4-b').value) || 0;
        const h = parseFloat(document.getElementById('st4-h').value) || 0;
        const c = parseFloat(document.getElementById('st4-cover').value) || 0;
        const hook = parseFloat(document.getElementById('st4-hook').value) || 0;
        const sDiam = getVal('st4-dia', 0);
        wastePercent = getVal('st4-waste', 5);

        if (spacing > 0) {
            const stirrupsPieceCount = Math.ceil(totalLen / spacing);
            const stirrupPerimeterVal = 2 * ((b - c) + (h - c)) + (2 * hook);
            const totalBarsLength = stirrupsPieceCount * stirrupPerimeterVal;
            const stdBars = Math.ceil(totalBarsLength / 12);
            totalBarsCount = stdBars;

            const sBarsPerTon = getBarsPerTon(sDiam);
            if (sBarsPerTon > 0) {
                resultWeight = stdBars / sBarsPerTon;
            } else {
                resultWeight = totalBarsLength * ((sDiam * sDiam) / 162) / 1000;
            }
        }
    }

    const resultWeightWithWaste = resultWeight * (1 + (wastePercent / 100));

    let finalHtml = `
        <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
            <h5 style="color: white; opacity: 0.9;">الوزن الإجمالي مع الهدر (${wastePercent}%)</h5>
            <span class="res-value" style="color: white;">${formatNum(resultWeightWithWaste)}</span>
            <span class="res-unit" style="color: white;">طن</span>
        </div>
        <div class="result-item">
            <h5>الوزن الصافي (بدون هدر)</h5>
            <span class="res-value">${formatNum(resultWeight)}</span>
            <span class="res-unit">طن</span>
        </div>
        <div class="result-item">
            <h5>عدد الشياش (12م) أو القطع</h5>
            <span class="res-value">${formatNum(totalBarsCount)}</span>
            <span class="res-unit">${mode === '3' ? 'قطعة' : 'شيش'}</span>
        </div>
    `;

    document.getElementById('steel-comp-grid').innerHTML = finalHtml + gridHtml;
    document.getElementById('steel-comp-result').style.display = 'block';
    saveToHistory("حساب الحديد", finalHtml + gridHtml);
}

/* --- Concrete Calculator --- */
function calculateConcrete() {
    const l = parseFloat(document.getElementById('conc-length').value) || 0;
    const w = parseFloat(document.getElementById('conc-width').value) || 0;
    const t = parseFloat(document.getElementById('conc-thick').value) || 0;
    const rC = getVal('conc-cement-r', 1);
    const rS = getVal('conc-sand-r', 2);
    const rG = getVal('conc-gravel-r', 4);
    const waste = getVal('conc-waste', 5);
    const p = getVal('conc-price', 0);

    if (l <= 0 || w <= 0 || t <= 0) {
        alert("يرجى إدخال الأبعاد بشكل صحيح");
        return;
    }

    const vol = l * w * t;
    const wasteFactor = 1 + (waste / 100);
    const totalVolWithWaste = vol * wasteFactor;

    if (rC + rS + rG <= 0) return;

    // ح = 0.67 * س * (مجموع النسب) -> Formula for dry volume
    // س = volume / (0.67 * (rC + rS + rG))
    const s = totalVolWithWaste / (0.67 * (rC + rS + rG));
    
    const cementVol = s * rC;
    const sandVol = s * rS;
    const gravelVol = s * rG;

    // حجم الكيس = 50 / 1400 = 0.035714
    const cementBags = Math.ceil(cementVol / (50 / 1400));
    const totalCost = vol * p;

    let html = `
        <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
            <h5 style="color: white; opacity: 0.9;">حجم الخرسانة مع الهدر</h5>
            <span class="res-value" style="color: white;">${formatNum(totalVolWithWaste)}</span>
            <span class="res-unit" style="color: white;">م³</span>
        </div>
        <div class="result-item">
            <h5>حجم الخرسانة الصافي</h5>
            <span class="res-value">${formatNum(vol)}</span>
            <span class="res-unit">م³</span>
        </div>
        <div class="result-item">
            <h5>الأسمنت المطلوب</h5>
            <span class="res-value">${formatNum(cementBags)}</span>
            <span class="res-unit">كيس (50كجم)</span>
        </div>
        <div class="result-item">
            <h5>الرمل المطلوب</h5>
            <span class="res-value">${formatNum(sandVol)}</span>
            <span class="res-unit">م³</span>
        </div>
        <div class="result-item">
            <h5>الحصى المطلوب</h5>
            <span class="res-value">${formatNum(gravelVol)}</span>
            <span class="res-unit">م³</span>
        </div>
    `;

    if (p > 0) {
        html += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h5>التكلفة الإجمالية (للحجم الصافي)</h5>
                <span class="res-value">${formatNum(totalCost)}</span>
                <span class="res-unit">دينار</span>
            </div>
        `;
    }

    document.getElementById('concrete-result-grid').innerHTML = html;
    document.getElementById('concrete-result').style.display = 'block';
    saveToHistory("حساب الخرسانة", html);
}

/* --- Block Calculator --- */
function toggleBlockSubMode() {
    const subMode = document.getElementById('block-sub-mode').value;
    const grpArea = document.getElementById('grp-block-area');
    const grpWallL = document.getElementById('grp-block-wall-L');
    const grpRoomW = document.getElementById('grp-block-room-W');
    const grpWallH = document.getElementById('grp-block-wall-H');
    const grpOpenings = document.getElementById('grp-block-openings');
    const lblLength = document.getElementById('lbl-block-length');

    if (subMode === 'area') {
        grpArea.style.display = 'flex';
        grpWallL.style.display = 'none';
        grpRoomW.style.display = 'none';
        grpWallH.style.display = 'none';
        grpOpenings.style.display = 'none';
    } else if (subMode === 'wall') {
        grpArea.style.display = 'none';
        grpWallL.style.display = 'flex';
        lblLength.textContent = 'طول الجدار (م)';
        grpRoomW.style.display = 'none';
        grpWallH.style.display = 'flex';
        grpOpenings.style.display = 'block';
    } else if (subMode === 'room') {
        grpArea.style.display = 'none';
        grpWallL.style.display = 'flex';
        lblLength.textContent = 'طول الغرفة (م)';
        grpRoomW.style.display = 'flex';
        grpWallH.style.display = 'flex';
        grpOpenings.style.display = 'block';
    }
    document.getElementById('block-result').style.display = 'none';
}

function calculateBlock() {
    const subMode = document.getElementById('block-sub-mode').value;
    
    let area = 0;
    let openingsArea = 0;

    if (subMode === 'area') {
        area = parseFloat(document.getElementById('block-area').value) || 0;
    } else {
        const wallH = parseFloat(document.getElementById('block-wall-h').value) || 0;
        const wallL = parseFloat(document.getElementById('block-wall-l').value) || 0;
        
        let grossArea = 0;
        if (subMode === 'wall') {
            grossArea = wallL * wallH;
        } else if (subMode === 'room') {
            const roomW = parseFloat(document.getElementById('block-room-w').value) || 0;
            // Room: Only walls (not counting floor/ceiling for standard blocks usually)
            grossArea = 2 * (wallL + roomW) * wallH;
        }

        const doorW = parseFloat(document.getElementById('block-door-w').value) || 0;
        const doorH = parseFloat(document.getElementById('block-door-h').value) || 0;
        const doorCount = parseFloat(document.getElementById('block-door-count').value) || 0;
        
        const winW = parseFloat(document.getElementById('block-win-w').value) || 0;
        const winH = parseFloat(document.getElementById('block-win-h').value) || 0;
        const winCount = parseFloat(document.getElementById('block-win-count').value) || 0;
        const extraOp = parseFloat(document.getElementById('block-openings-extra').value) || 0;

        openingsArea = (doorW * doorH * doorCount) + (winW * winH * winCount) + extraOp;
        area = grossArea - openingsArea;

        if (area < 0) {
            alert("مساحة الفتحات المخصومة أكبر من المساحة الكلية!");
            return;
        }
    }

    const length = getVal('block-L', 0);
    const height = getVal('block-H', 0);
    const blockPrice = getVal('block-price', 0);
    const waste = getVal('block-waste', 10);
    const mortarMm = getVal('block-mortar', 10);

    if (length <= 0 || height <= 0 || area <= 0) {
        alert("أدخل قيم صحيحة للأبعاد والمساحة");
        return;
    }

    const mortarCm = mortarMm / 10;
    const blockArea = (length + mortarCm) * (height + mortarCm);
    const requiredAreaCm = area * 10000;

    const blocksNeeded = Math.ceil(requiredAreaCm / blockArea);
    const totalBlocks = Math.ceil(blocksNeeded * (1 + waste / 100));
    const totalCost = totalBlocks * blockPrice;

    let html = ``;
    if (subMode !== 'area') {
        html += `
            <div class="result-item"><h5>مساحة الفتحات المخصومة</h5><span class="res-value">${formatNum(openingsArea)}</span><span class="res-unit">م²</span></div>
            <div class="result-item"><h5>المجموع الصافي لبناء البلوك</h5><span class="res-value">${formatNum(area)}</span><span class="res-unit">م²</span></div>
        `;
    }

    html += `
        <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
            <h5 style="color: white; opacity: 0.9;">عدد البلوكات المطلوبة</h5>
            <span class="res-value" style="color: white;">${formatNum(totalBlocks)}</span>
            <span class="res-unit" style="color: white;">بلوكة</span>
        </div>
    `;

    if (blockPrice > 0) {
        html += `
            <div class="result-item" style="grid-column: 1 / -1;">
                <h5 style="color: red;">التكلفة الإجمالية</h5>
                <span class="res-value" style="color: red;">${formatNum(totalCost)}</span>
                <span class="res-unit" style="color: red;">دينار</span>
            </div>
        `;
    }

    document.getElementById('block-result-grid').innerHTML = html;
    document.getElementById('block-result').style.display = 'block';
    saveToHistory("حساب البلوك", html);
}

/* --- History Management --- */
function saveToHistory(calcName, resultText) {
    let history = JSON.parse(localStorage.getItem('civileng_history') || '[]');
    const newItem = {
        id: Date.now(),
        name: calcName,
        result: resultText,
        date: new Date().toLocaleString('ar-EG')
    };
    history.unshift(newItem);
    if (history.length > 50) history.pop(); 
    localStorage.setItem('civileng_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('civileng_history') || '[]');
    
    if (history.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">لا توجد حسابات مسجلة حالياً.</div>`;
        return;
    }

    list.innerHTML = history.map(item => `
        <div class="glass-card" style="padding: 1.5rem; margin-bottom: 0; background: rgba(255, 255, 255, 0.02);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                <div>
                    <h5 style="color: var(--primary); margin: 0;">${item.name}</h5>
                    <small style="color: var(--text-muted);">${item.date}</small>
                </div>
                <button onclick="deleteHistoryItem(${item.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 5px;"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6;">
                <div class="result-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                    ${item.result}
                </div>
            </div>
        </div>
    `).join('');
}

function deleteHistoryItem(id) {
    let history = JSON.parse(localStorage.getItem('civileng_history') || '[]');
    history = history.filter(item => item.id !== id);
    localStorage.setItem('civileng_history', JSON.stringify(history));
    renderHistory();
}

function clearHistory() {
    if (confirm("هل أنت متأكد من مسح جميع الحسابات المسجلة؟")) {
        localStorage.removeItem('civileng_history');
        renderHistory();
    }
}

// Initial Render
renderHistory();

// Navigation History update
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.getAttribute('data-target') === 'history-calc') {
            renderHistory();
        }
    });
});

/* --- Multi-Language System (i18n) --- */
const translations = {
    ar: {
        "nav-home": "الرئيسية",
        "nav-brick": "حاسبة الطابوق",
        "nav-ceramic": "حاسبة السيراميك",
        "nav-plaster": "حاسبة البياض (المساح)",
        "nav-excavation": "حاسبة الحفريات",
        "nav-steel": "حاسبة الحديد",
        "nav-concrete": "حاسبة الخرسانة والكميات",
        "nav-block": "حاسبة البلوك",
        "nav-history": "سجل الحسابات",
        "menu-theme": "الوضع ليلي/نهاري",
        "dash-welcome": "مرحباً بك في CivilEng Pro",
        "owner-name": "المهندس حسن منذر",
        "dash-subtitle": "اختر إحدى الحاسبات الهندسية من القائمة الجانبية للبدء بحساب الكميات بدقة عالية."
    },
    en: {
        "nav-home": "Home",
        "nav-brick": "Brick Calculator",
        "nav-ceramic": "Ceramic Calculator",
        "nav-plaster": "Plastering Calc",
        "nav-excavation": "Excavation Calc",
        "nav-steel": "Steel Calculator",
        "nav-concrete": "Concrete Calc",
        "nav-block": "Block Calculator",
        "nav-history": "History Log",
        "menu-theme": "Dark/Light Mode",
        "dash-welcome": "Welcome to CivilEng Pro",
        "owner-name": "Eng. Hassan Munther",
        "dash-subtitle": "Select an engineering calculator from the sidebar to start precise quantity estimation."
    },
    ku: {
        "nav-home": "سەرەکی",
        "nav-brick": "حاسیبەی خشت",
        "nav-ceramic": "حاسیبەی سیرامیک",
        "nav-plaster": "حاسیبەی سپیکردنەوە",
        "nav-excavation": "حاسیبەی هەڵکەندن",
        "nav-steel": "حاسیبەی ئاسن",
        "nav-concrete": "حاسیبەی کۆنکریت",
        "nav-block": "حاسیبەی بلۆک",
        "nav-history": "تۆماری حسابات",
        "menu-theme": "دۆخی شەو/ڕۆژ",
        "dash-welcome": "بەخێربێیت بۆ CivilEng Pro",
        "owner-name": "ئەندازیار حەسەن موندەر",
        "dash-subtitle": "حاسیبەیەکی ئەندازیاری لە لیستی لاتەنیشت هەڵبژێرە بۆ دەستپێکردنی حسابکردنی بڕەکان."
    }
};

function setLanguage(lang) {
    localStorage.setItem('civileng_lang', lang);
    applyLanguage(lang);
}

function applyLanguage(lang) {
    const root = document.documentElement;
    if (lang === 'en') {
        root.setAttribute('dir', 'ltr');
        root.setAttribute('lang', 'en');
    } else {
        root.setAttribute('dir', 'rtl');
        root.setAttribute('lang', lang);
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Close menu
    document.getElementById('user-menu').style.display = 'none';
}

/* --- User Menu Functions --- */
function toggleUserMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('user-menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('civileng_theme', isLight ? 'light' : 'dark');
}

// Close menu when clicking outside
window.addEventListener('click', () => {
    document.getElementById('user-menu').style.display = 'none';
});

// Load Theme and Lang status
if (localStorage.getItem('civileng_theme') === 'light') {
    document.body.classList.add('light-theme');
}

const savedLang = localStorage.getItem('civileng_lang') || 'ar';
applyLanguage(savedLang);
