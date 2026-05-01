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

const parseArabicNum = (str) => {
    if (!str) return NaN;
    // Replace Arabic numerals with English numerals
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let englishStr = String(str);
    for (let i = 0; i < 10; i++) {
        englishStr = englishStr.split(arabicNumbers[i]).join(i.toString());
    }
    // Replace Arabic comma with dot
    englishStr = englishStr.replace('،', '.');
    return parseFloat(englishStr);
};

const getVal = (id, def = 0) => {
    const el = document.getElementById(id);
    if (!el) return def;
    const v = el.value;
    const parsed = parseArabicNum(v);
    return (v === "" || isNaN(parsed)) ? def : parsed;
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
    const lbl = document.getElementById('lbl-brick-length');
    const roomGrp = document.getElementById('grp-brick-room-w');
    
    if (mode === 'wall') {
        lbl.textContent = 'طول الجدار (م)';
        roomGrp.style.display = 'none';
    } else if (mode === 'room') {
        lbl.textContent = 'طول الغرفة (م)';
        roomGrp.style.display = 'block';
    } else if (mode === 'half_circle' || mode === 'quarter_circle') {
        lbl.textContent = 'نصف القطر (م)';
        roomGrp.style.display = 'none';
    } else if (mode === 'total_lengths') {
        lbl.textContent = 'مجموع الأطوال (م)';
        roomGrp.style.display = 'none';
    } else if (mode === 'volume') {
        lbl.textContent = 'الحجم المعلوم (م³)';
        roomGrp.style.display = 'none';
        document.getElementById('grp-brick-vol').style.display = 'block';
    }
    
    if (mode !== 'volume') {
        document.getElementById('grp-brick-vol').style.display = 'none';
    }
    
    document.getElementById('brick-result').style.display = 'none';
}

function calculateBrick() {
    const subMode = document.getElementById('brick-sub-mode').value;
    
    const brickL = getVal('brick-l', 24);
    const brickW = getVal('brick-w', 12);
    const brickH = getVal('brick-h', 8);
    const mortar = getVal('brick-mortar', 1);
    const price = getVal('brick-price', 500000);
    
    const wallL = getVal('brick-wall-l', 0);
    const wallH = getVal('brick-wall-h', 0);
    const wallThick = getVal('brick-wall-thick', 0.25);
    const waste = getVal('brick-waste', 5);

    // Calculate Openings Area
    const doorW = getVal('brick-door-w', 0);
    const doorH = getVal('brick-door-h', 0);
    const doorCount = getVal('brick-door-count', 0);
    
    const winW = getVal('brick-win-w', 0);
    const winH = getVal('brick-win-h', 0);
    const winCount = getVal('brick-win-count', 0);

    const openingsExtra = getVal('brick-openings-extra', 0);

    const openingsArea = (doorW * doorH * doorCount) + (winW * winH * winCount) + openingsExtra;

    let wallArea = 0;
    if (subMode === 'wall') {
        wallArea = wallL * wallH;
    } else if (subMode === 'room') {
        const roomW = getVal('brick-room-w', 0);
        wallArea = 2 * (wallL + roomW) * wallH;
    } else if (subMode === 'half_circle') {
        const actualL = wallL * Math.PI;
        wallArea = actualL * wallH;
    } else if (subMode === 'quarter_circle') {
        const actualL = wallL * Math.PI / 2;
        wallArea = actualL * wallH;
    } else if (subMode === 'total_lengths') {
        wallArea = wallL * wallH;
    } else if (subMode === 'volume') {
        const volumeVal = getVal('brick-vol', 0);
        wallArea = volumeVal / wallThick; // Working backwards for area-based logic if needed, but we'll use volume directly
    }

    let netArea = wallArea - openingsArea;
    if (subMode === 'volume') {
        // In volume mode, we ignore openings area unless specifically provided as extra volume to subtract
        netArea = wallArea; 
    }

    if (netArea < 0) {
        alert("مساحة الفتحات أكبر من مساحة الجدران!");
        return;
    }
    if (wallArea <= 0 && subMode !== 'volume') return;
    if (subMode === 'volume' && getVal('brick-vol', 0) <= 0) return;

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
        let modeText = 'جدار حامل';
        if (subMode === 'room') modeText = 'غرفة كاملة';
        else if (subMode === 'half_circle') modeText = 'نصف دائرة';
        else if (subMode === 'quarter_circle') modeText = 'ربع دائرة';
        else if (subMode === 'total_lengths') modeText = 'مجموع أطوال';
        else if (subMode === 'volume') modeText = 'حجم معلوم';

        let targetVolume = netArea * wallThick;
        if (subMode === 'volume') targetVolume = getVal('brick-vol', 0);
        
        rawBricks = targetVolume * bricksPerCubicM;
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

    // Add Cement and Sand Estimation
    let netVolume = (subMode === 'volume') ? getVal('brick-vol', 0) : (netArea * wallThick);
    const cementBags = Math.ceil(netVolume * 0.11 * (1000 / 50)); // Approx 0.11 m3 mortar per m3 building, etc.
    // Standard rule: 1m3 building bricks needs ~0.25m3 mortar. 
    // 1m3 mortar (1:3) needs ~450kg cement (~9 bags) and 1.1m3 sand.
    // So 1m3 building needs ~0.25 * 9 = 2.25 bags.
    const estCement = Math.ceil(netVolume * 2.25);
    const estSand = netVolume * 0.25;

    html += `
        <div class="result-item">
            <h5>مكعب البناء الصافي</h5>
            <span class="res-value">${formatNum(netVolume)}</span>
            <span class="res-unit">م³</span>
        </div>
        <div class="result-item">
            <h5>الأسمنت التقديري</h5>
            <span class="res-value">${estCement}</span>
            <span class="res-unit">كيس</span>
        </div>
        <div class="result-item">
            <h5>الرمل التقديري</h5>
            <span class="res-value">${formatNum(estSand)}</span>
            <span class="res-unit">م³</span>
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
        area = getVal('ceramic-area', 0);
    } else {
        const wallH = getVal('ceramic-wall-h', 0);
        const wallL = getVal('ceramic-wall-l', 0);
        
        let grossArea = 0;
        if (subMode === 'wall') {
            grossArea = wallL * wallH;
        } else if (subMode === 'room') {
            const roomW = getVal('ceramic-room-w', 0);
            // Floor area + walls area
            grossArea = (wallL * roomW) + (2 * (wallL + roomW) * wallH);
        }

        const doorW = getVal('ceramic-door-w', 0);
        const doorH = getVal('ceramic-door-h', 0);
        const doorCount = getVal('ceramic-door-count', 0);
        
        const winW = getVal('ceramic-win-w', 0);
        const winH = getVal('ceramic-win-h', 0);
        const winCount = getVal('ceramic-win-count', 0);
        const extraOp = getVal('ceramic-openings-extra', 0);

        openingsArea = (doorW * doorH * doorCount) + (winW * winH * winCount) + extraOp;
        area = grossArea - openingsArea;

        if (area < 0) {
            alert("مساحة الفتحات أكبر من المساحة الكلية!");
            return;
        }
    }

    const l = getVal('ceramic-l', 0);
    const w = getVal('ceramic-w', 0);
    const tilesPerBox = getVal('ceramic-box-count', 4);
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
    const wallH = getVal('plaster-wall-height', 0);
    const price = getVal('plaster-price', 0);
    const waste = getVal('plaster-waste', 5);
    
    // Auto-calculate Openings and Reveals
    const wallThick = getVal('plaster-wall-thick', 0.25);
    const doorW = getVal('plaster-door-w', 0);
    const doorH = getVal('plaster-door-h', 0);
    const doorCount = getVal('plaster-door-count', 0);
    
    const winW = getVal('plaster-win-w', 0);
    const winH = getVal('plaster-win-h', 0);
    const winCount = getVal('plaster-win-count', 0);

    const opExtra = getVal('plaster-openings-extra', 0);
    const revExtra = getVal('plaster-reveals-extra', 0);

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
        const wallL = getVal('plaster-wall-len', 0);
        grossArea = wallL * wallH;
    } else {
        const roomL = getVal('plaster-room-len', 0);
        const roomW = getVal('plaster-room-width', 0);
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

        const thick = getVal('plaster-thick', 0.02);
        const rC = getVal('plaster-cement-ratio', 1);
        const rS = getVal('plaster-sand-ratio', 3);
        
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
        const thick = getVal('gypsum-thick', 0.02);
        const density = getVal('gypsum-density', 1000);
        const loss = getVal('gypsum-loss', 10);
        
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
    const l = getVal('exc-wall-l', 0);
    const count = getVal('exc-wall-count', 1);
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
        const l = getVal('exc-length', 0);
        const w = getVal('exc-width', 0);
        
        if (l <= 0 || w <= 0) {
            alert("يرجى إدخال الطول والعرض بشكل صحيح");
            return;
        }
        
        vol = l * w * d;
    } else {
        const w = getVal('exc-width-shared', 0);
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
    let mainCalcName = "حساب الحديد";

    const getWeightPerM = (d) => (d * d) / 162;

    if (mode === '1') {
        mainCalcName = "أساس حصيري / سقف";
        const L = getVal('st1-length', 0);
        const W = getVal('st1-width', 0);
        const spacing = getVal('st1-spacing', 0);
        const cover = getVal('st1-cover', 0);
        const d = getVal('st1-diameter', 0);
        const layers = getVal('st1-layers', 0);
        const manualBarsPerTon = getVal('st1-bars-per-ton', 0);
        wastePercent = getVal('st1-waste', 5);
        const overlapCoeff = getVal('st1-overlap', 60);
        const projectType = document.getElementById('st1-project-type').value;

        if (spacing === 0) return;

        const countShort = Math.ceil(L / spacing) + 1;
        const lengthShortTotal = countShort * (W - (2 * cover));
        const stdBarsShort = Math.ceil(lengthShortTotal / 12);

        const countLong = Math.ceil(W / spacing) + 1;
        const lengthLongTotal = countLong * (L - (2 * cover));
        const stdBarsLong = Math.ceil(lengthLongTotal / 12);

        const lapLen = (overlapCoeff * d) / 1000;
        const lapTotalLen = (countLong + countShort) * lapLen; 
        const slabOverlapStdBars = Math.ceil(lapTotalLen / 12);

        const barsPerTon = manualBarsPerTon > 0 ? manualBarsPerTon : getBarsPerTon(d);
        const weightPerMeter = getWeightPerM(d);

        if (barsPerTon > 0) {
            const slabOverlapWeightVal = slabOverlapStdBars / barsPerTon;
            const weightShort = stdBarsShort / barsPerTon;
            const weightLong = stdBarsLong / barsPerTon;
            resultWeight = (weightShort + weightLong + slabOverlapWeightVal) * layers;
            totalBarsCount = (stdBarsShort + stdBarsLong + slabOverlapStdBars) * layers;
        } else {
            const slabOverlapWeightVal = (lapTotalLen * weightPerMeter) / 1000;
            const weightShort = (lengthShortTotal * weightPerMeter) / 1000;
            const weightLong = (lengthLongTotal * weightPerMeter) / 1000;
            resultWeight = (weightShort + weightLong + slabOverlapWeightVal) * layers;
            totalBarsCount = Math.ceil((lengthShortTotal + lengthLongTotal + lapTotalLen) / 12) * layers;
        }

        let beamCoeff = 0.333;
        if (projectType === 'normal') beamCoeff = 0.35;
        else if (projectType === 'heavy') beamCoeff = 0.50;

        const raftBeamWeight = resultWeight * beamCoeff;
        const raftStirrupWeight = raftBeamWeight / 3;
        
        const finalWeightNet = resultWeight + raftBeamWeight + raftStirrupWeight;
        const finalWeightWithWaste = finalWeightNet * (1 + wastePercent / 100);

        gridHtml = `
            <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); color: white;">
                <h5 style="color: white; opacity: 0.9;">الوزن الإجمالي المطلوب (مع الهدر)</h5>
                <span class="res-value" style="color: white;">${formatNum(finalWeightWithWaste)}</span>
                <span class="res-unit" style="color: white;">طن</span>
            </div>
            <div class="result-item"><h5>وزن الحصيرات الصافي (${layers} طبقات)</h5><span class="res-value">${formatNum(resultWeight)}</span><span class="res-unit">طن</span></div>
            <div class="result-item"><h5>وزن العوارض (تقديري)</h5><span class="res-value">${formatNum(raftBeamWeight)}</span><span class="res-unit">طن</span></div>
            <div class="result-item"><h5>وزن الأتاري (تقديري)</h5><span class="res-value">${formatNum(raftStirrupWeight)}</span><span class="res-unit">طن</span></div>
            <div class="result-item"><h5>إجمالي عدد الأشياش (12م)</h5><span class="res-value">${totalBarsCount}</span><span class="res-unit">شيش</span></div>
        `;
    } 
    else if (mode === '2') {
        mainCalcName = "أساس شريطي / جسور";
        const length = getVal('st2-length', 0);
        const count1 = getVal('st2-count1', 0);
        const d = getVal('st2-dia1', 0);
        const useDual = document.getElementById('st2-use-dual').checked;
        const manualBarsPerTon = getVal('st2-bars-per-ton', 0);
        wastePercent = getVal('st2-waste', 5);

        const weightPerMeter = getWeightPerM(d);
        const totalLen1 = length * count1;
        const stdBarsLong = Math.ceil(totalLen1 / 12);
        const barsPerTon1 = manualBarsPerTon > 0 ? manualBarsPerTon : getBarsPerTon(d);

        let beamWeightVal = barsPerTon1 > 0 ? (stdBarsLong / barsPerTon1) : (totalLen1 * weightPerMeter / 1000);
        let beamTotalStdBars = stdBarsLong;

        if (useDual) {
            const dDual = getVal('st2-dia2', 0);
            const count2 = getVal('st2-count2', 0);
            const totalLen2 = length * count2;
            const stdBarsDual = Math.ceil(totalLen2 / 12);
            const barsPerTon2 = manualBarsPerTon > 0 ? manualBarsPerTon : getBarsPerTon(dDual);
            
            let weight2 = barsPerTon2 > 0 ? (stdBarsDual / barsPerTon2) : (totalLen2 * getWeightPerM(dDual) / 1000);
            beamWeightVal += weight2;
            beamTotalStdBars += stdBarsDual;
        }

        const overlapCoeff = getVal('st2-overlap', 60);
        const stairCount = getVal('st2-stair-count', 0);
        const stairLapLenVal = (overlapCoeff * d) / 1000;
        const totalLenAshOneSide = stairCount * stairLapLenVal;
        const stdBarsAshOneSide = Math.ceil(totalLenAshOneSide / 12);
        
        let stairWeightVal = barsPerTon1 > 0 ? (stdBarsAshOneSide / barsPerTon1) * 2 : (totalLenAshOneSide * 2 * weightPerMeter / 1000);

        const sSpacing = getVal('st2-stirrup-spacing', 0);
        const sDiam = getVal('st2-stirrup-dia', 0);
        const bWidth = getVal('st2-width', 0);
        const bHeight = getVal('st2-height', 0);
        const sCover = getVal('st2-cover', 0);
        const sHook = getVal('st2-hook', 0);

        let sStdBars = 0;
        let stirrupsWeight = 0;
        if (sSpacing > 0) {
            const stirrupsPieceCount = Math.ceil(length / sSpacing);
            const stirrupPerimeterVal = 2 * ((bWidth - 2 * sCover) + (bHeight - 2 * sCover)) + (2 * sHook);
            const sTotalLen = stirrupsPieceCount * stirrupPerimeterVal;
            sStdBars = Math.ceil(sTotalLen / 12);
            const sBarsPerTon = getBarsPerTon(sDiam);
            stirrupsWeight = sBarsPerTon > 0 ? (sStdBars / sBarsPerTon) : (sTotalLen * getWeightPerM(sDiam) / 1000);
        }

        resultWeight = beamWeightVal + stairWeightVal + stirrupsWeight;
        totalBarsCount = beamTotalStdBars + stdBarsAshOneSide + sStdBars;

        gridHtml = `
            <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); color: white;">
                <h5 style="color: white; opacity: 0.9;">الوزن الإجمالي مع الهدر (${wastePercent}%)</h5>
                <span class="res-value" style="color: white;">${formatNum(resultWeight * (1 + wastePercent/100))}</span>
                <span class="res-unit" style="color: white;">طن</span>
            </div>
            <div class="result-item"><h5>وزن الحديد الطولي</h5><span class="res-value">${formatNum(beamWeightVal)}</span><span class="res-unit">طن</span></div>
            <div class="result-item"><h5>وزن الأتاري</h5><span class="res-value">${formatNum(stirrupsWeight)}</span><span class="res-unit">طن</span></div>
            <div class="result-item"><h5>وزن أشاير الدرج</h5><span class="res-value">${formatNum(stairWeightVal)}</span><span class="res-unit">طن</span></div>
        `;
    }
    else if (mode === '3') {
        mainCalcName = "تسليح الأعمدة";
        const dol = getVal('st3-dol', 0);
        const slab = getVal('st3-slab', 0);
        const floor = getVal('st3-floor', 0);
        const height = dol + slab + floor;
        const count = getVal('st3-count', 0);
        const numColumns = getVal('st3-cols', 1);
        const d = getVal('st3-dia', 0);
        const manualWM = getVal('st3-weight-per-m', 0);
        const effectiveW = manualWM > 0 ? manualWM : getWeightPerM(d);

        resultWeight = (height * count * numColumns * effectiveW) / 1000;
        totalBarsCount = count * numColumns;

        gridHtml = `
            <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); color: white;">
                <h5 style="color: white; opacity: 0.9;">الوزن الإجمالي للأعمدة</h5>
                <span class="res-value" style="color: white;">${formatNum(resultWeight)}</span>
                <span class="res-unit" style="color: white;">طن</span>
            </div>
            <div class="result-item"><h5>طول الشيش الواحد</h5><span class="res-value">${height.toFixed(2)}</span><span class="res-unit">م</span></div>
            <div class="result-item"><h5>إجمالي عدد القطع</h5><span class="res-value">${totalBarsCount}</span><span class="res-unit">قطعة</span></div>
        `;
    }
    else if (mode === '4') {
        mainCalcName = "كانات الأعمدة";
        const totalLen = getVal('st4-length', 0);
        const spacing = getVal('st4-spacing', 0);
        const b = getVal('st4-b', 0);
        const h = getVal('st4-h', 0);
        const c = getVal('st4-cover', 0);
        const hook = getVal('st4-hook', 0);
        const sDiam = getVal('st4-dia', 0);
        wastePercent = getVal('st4-waste', 5);

        if (spacing > 0) {
            const sCount = Math.ceil(totalLen / spacing);
            const sPerim = 2 * ((b - 2*c) + (h - 2*c)) + (2 * hook);
            const totalLenS = sCount * sPerim;
            const stdBars = Math.ceil(totalLenS / 12);
            const sBarsPerTon = getBarsPerTon(sDiam);
            resultWeight = sBarsPerTon > 0 ? (stdBars / sBarsPerTon) : (totalLenS * getWeightPerM(sDiam) / 1000);

            gridHtml = `
                <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); color: white;">
                    <h5 style="color: white; opacity: 0.9;">وزن الكانات مع الهدر</h5>
                    <span class="res-value" style="color: white;">${formatNum(resultWeight * (1 + wastePercent/100))}</span>
                    <span class="res-unit" style="color: white;">طن</span>
                </div>
                <div class="result-item"><h5>عدد الكانات</h5><span class="res-value">${sCount}</span><span class="res-unit">كانة</span></div>
                <div class="result-item"><h5>طول الكانة الواحدة</h5><span class="res-value">${sPerim.toFixed(2)}</span><span class="res-unit">م</span></div>
            `;
        }
    }

    document.getElementById('steel-comp-grid').innerHTML = gridHtml;
    document.getElementById('steel-comp-result').style.display = 'block';
    saveToHistory(mainCalcName, gridHtml);
}

/* --- Concrete / Quantity Calculator --- */
function calculateConcrete() {
    const l = getVal('conc-length', 0);
    const w = getVal('conc-width', 0);
    const t = getVal('conc-thick', 0);
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

/* --- Mix Design Calculator --- */
function toggleMixGrade() {
    const grade = document.getElementById('mix-grade').value;
    const cInput = document.getElementById('mix-c');
    const sInput = document.getElementById('mix-s');
    const gInput = document.getElementById('mix-g');
    
    if (grade === 'Custom') {
        cInput.disabled = false;
        sInput.disabled = false;
        gInput.disabled = false;
        cInput.value = '';
        sInput.value = '';
        gInput.value = '';
    } else {
        cInput.disabled = true;
        sInput.disabled = true;
        gInput.disabled = true;
        if (grade === 'M10') { cInput.value = 1; sInput.value = 3; gInput.value = 6; }
        else if (grade === 'M15') { cInput.value = 1; sInput.value = 2; gInput.value = 4; }
        else if (grade === 'M20') { cInput.value = 1; sInput.value = 1.5; gInput.value = 3; }
        else if (grade === 'M25') { cInput.value = 1; sInput.value = 1; gInput.value = 2; }
    }
    document.getElementById('mix-result').style.display = 'none';
}

function calculateMixDesign() {
    const vol = parseFloat(document.getElementById('mix-vol').value) || 0;
    const waste = getVal('mix-waste', 5);
    const wcRatio = parseFloat(document.getElementById('mix-wc').value) || 0;
    
    const cRatio = parseFloat(document.getElementById('mix-c').value) || 0;
    const sRatio = parseFloat(document.getElementById('mix-s').value) || 0;
    const gRatio = parseFloat(document.getElementById('mix-g').value) || 0;

    if (vol <= 0 || cRatio <= 0 || sRatio <= 0 || gRatio <= 0 || wcRatio <= 0) {
        alert("يرجى التأكد من إدخال جميع النسب والحجم بشكل صحيح.");
        return;
    }

    const totalWetVolume = vol * (1 + (waste / 100));
    const totalDryVolume = totalWetVolume * 1.54;
    const totalRatio = cRatio + sRatio + gRatio;

    const cementDryVolume = (totalDryVolume * cRatio) / totalRatio;
    const cementWeight = cementDryVolume * 1440;
    const cementBags = cementWeight / 50;

    const sandVolume = (totalDryVolume * sRatio) / totalRatio;
    const gravelVolume = (totalDryVolume * gRatio) / totalRatio;
    const waterLiters = cementWeight * wcRatio;

    let html = `
        <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
            <h5 style="color: white; opacity: 0.9;">الحجم الكلي مع الهدر</h5>
            <span class="res-value" style="color: white;">${formatNum(totalWetVolume)}</span>
            <span class="res-unit" style="color: white;">م³</span>
        </div>
        <div class="result-item">
            <h5>الأسمنت المطلوب</h5>
            <span class="res-value">${Math.ceil(cementBags)}</span>
            <span class="res-unit">كيس (50كجم)</span>
        </div>
        <div class="result-item">
            <h5>الرمل المطلوب</h5>
            <span class="res-value">${formatNum(sandVolume)}</span>
            <span class="res-unit">م³</span>
        </div>
        <div class="result-item">
            <h5>الحصى (الزلط) المطلوب</h5>
            <span class="res-value">${formatNum(gravelVolume)}</span>
            <span class="res-unit">م³</span>
        </div>
        <div class="result-item" style="grid-column: 1 / -1;">
            <h5 style="color: #0284c7;">الماء المطلوب</h5>
            <span class="res-value" style="color: #0284c7;">${formatNum(waterLiters)}</span>
            <span class="res-unit" style="color: #0284c7;">لتر</span>
        </div>
    `;

    document.getElementById('mix-result-grid').innerHTML = html;
    document.getElementById('mix-result').style.display = 'block';
    saveToHistory("تصميم الخلطة الخرسانية", html);
}

/* --- Rebar Substitution Calculator --- */
function calculateRebarSub() {
    const origCount = getVal('rebar-orig-count', 10);
    const origDia = getVal('rebar-orig-dia', 12);
    const newDia = getVal('rebar-new-dia', 16);
    const aggSize = getVal('rebar-agg-size', 20);

    if (origDia <= 0 || newDia <= 0 || origCount <= 0) {
        alert("أدخل قيم صحيحة للقطر والعدد");
        return;
    }

    const limit1 = Math.max(origDia, newDia);
    const limit2 = 25.0;
    const limit3 = aggSize * 1.33;
    const minClearSpacing = Math.max(limit1, limit2, limit3);

    const newCountRaw = origCount * Math.pow(origDia, 2) / Math.pow(newDia, 2);
    const newCount = Math.ceil(newCountRaw);

    const origArea = origCount * Math.PI * Math.pow(origDia / 2, 2);
    const newArea = newCount * Math.PI * Math.pow(newDia / 2, 2);
    const diff = newArea - origArea;
    const isSafe = diff >= 0;

    let html = `
        <div class="result-item" style="grid-column: 1 / -1; background: ${isSafe ? '#f0fdf4' : '#fef2f2'}; border-right: 4px solid ${isSafe ? '#16a34a' : '#ef4444'};">
            <h5 style="color: ${isSafe ? '#16a34a' : '#ef4444'}; font-weight: bold;">الحالة: ${isSafe ? 'آمنة ✓' : 'غير آمنة ⚠️'}</h5>
            <span style="font-size: 0.9rem; color: ${isSafe ? '#15803d' : '#b91c1c'};">
                ${isSafe ? 'المقترح آمن والتسليح الجديد يغطي المساحة المطلوبة.' : 'تنبيه: التسليح الجديد غير آمن حيث يعطي مساحة أقل من الأصلية.'}
            </span>
        </div>
        <div class="result-item" style="grid-column: 1 / -1; background: var(--primary); outline: 2px solid white; color: white;">
            <h5 style="color: white; opacity: 0.9;">العدد المطلوب للقطر الجديد</h5>
            <span class="res-value" style="color: white;">${newCount}</span>
            <span class="res-unit" style="color: white;">شيش</span>
        </div>
        <div class="result-item" style="background: #fff7ed; border-right: 4px solid #f97316;">
            <h5 style="color: #c2410c;">أقل مسافة مسموحة</h5>
            <span class="res-value" style="color: #c2410c;">${formatNum(minClearSpacing)}</span>
            <span class="res-unit" style="color: #c2410c;">ملم</span>
        </div>
        <div class="result-item">
            <h5>الفرق في المساحة</h5>
            <span class="res-value" style="color: ${isSafe ? '#16a34a' : '#ef4444'};">${diff > 0 ? '+' : ''}${formatNum(diff)}</span>
            <span class="res-unit" style="color: ${isSafe ? '#16a34a' : '#ef4444'};">ملم²</span>
        </div>
        <div class="result-item">
            <h5>المساحة الأصلية</h5>
            <span class="res-value">${formatNum(origArea)}</span>
            <span class="res-unit">ملم²</span>
        </div>
        <div class="result-item">
            <h5>المساحة الجديدة</h5>
            <span class="res-value">${formatNum(newArea)}</span>
            <span class="res-unit">ملم²</span>
        </div>
    `;

    document.getElementById('rebar-sub-result-grid').innerHTML = html;
    document.getElementById('rebar-sub-result').style.display = 'block';
    saveToHistory("استبدال الأقطار", html);
}

/* --- Unit Converter --- */
const units = {
    length: { 'm': {n:'متر', r:1}, 'cm': {n:'سم', r:0.01}, 'mm': {n:'ملم', r:0.001}, 'km': {n:'كم', r:1000}, 'in': {n:'إنش', r:0.0254}, 'ft': {n:'قدم', r:0.3048}, 'yd': {n:'ياردة', r:0.9144}, 'mi': {n:'ميل', r:1609.34} },
    area: { 'm2': {n:'متر²', r:1}, 'cm2': {n:'سم²', r:0.0001}, 'ft2': {n:'قدم²', r:0.092903}, 'hectare': {n:'هكتار', r:10000}, 'acre': {n:'فدان', r:4046.86}, 'dunam': {n:'دونم (عراقي)', r:2500} },
    volume: { 'm3': {n:'متر³', r:1}, 'liter': {n:'لتر', r:0.001}, 'cm3': {n:'سم³', r:0.000001}, 'ft3': {n:'قدم³', r:0.0283168}, 'gallon': {n:'غالون أمريكي', r:0.00378541} },
    weight: { 'kg': {n:'كغم', r:1}, 'g': {n:'غرام', r:0.001}, 'ton': {n:'طن', r:1000}, 'lb': {n:'باوند', r:0.453592} },
    pressure: { 'Pa': {n:'باسكال (Pa)', r:1}, 'kPa': {n:'كيلوباسكال (kPa)', r:1000}, 'MPa': {n:'ميغاباسكال (MPa)', r:1000000}, 'bar': {n:'بار', r:100000}, 'psi': {n:'رطل/بوصة² (psi)', r:6894.76} },
    force: { 'N': {n:'نيوتن', r:1}, 'kN': {n:'كيلونيوتن', r:1000}, 'kgf': {n:'كغم قوة', r:9.80665} }
};

function toggleConvType() {
    const type = document.getElementById('conv-type').value;
    const fromSel = document.getElementById('conv-from');
    const toSel = document.getElementById('conv-to');
    
    let opts = '';
    for (const [key, val] of Object.entries(units[type])) {
        opts += `<option value="${key}">${val.n}</option>`;
    }
    fromSel.innerHTML = opts;
    toSel.innerHTML = opts;
    
    if (fromSel.options.length > 1) {
        toSel.selectedIndex = 1;
    }
    calculateConversion();
}

function calculateConversion() {
    const type = document.getElementById('conv-type').value;
    const val = getVal('conv-value', 0);
    const from = document.getElementById('conv-from').value;
    const to = document.getElementById('conv-to').value;
    
    if (!from || !to) return;
    
    const baseVal = val * units[type][from].r;
    const result = baseVal / units[type][to].r;
    
    document.getElementById('conv-result-val').textContent = formatNum(result) + ' ' + units[type][to].n;
    document.getElementById('conv-result').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('conv-type')) toggleConvType();
});

/* --- Stairs Calculator --- */
function calculateStairs() {
    const floorH = getVal('stair-floor-h', 3.2);
    const targetR = getVal('stair-target-r', 0.16);
    const targetT = getVal('stair-target-t', 0.30);
    const stairW = getVal('stair-width', 1.2);
    const availL = getVal('stair-avail-l', 4.0);
    const availW = getVal('stair-avail-w', 2.5);

    if (floorH <= 0 || targetR <= 0 || targetT <= 0 || stairW <= 0) {
        alert("يرجى إدخال جميع الأبعاد بشكل صحيح");
        return;
    }

    const totalSteps = Math.round(floorH / targetR);
    const actualRiser = floorH / totalSteps;
    const totalRunLength = (totalSteps - 1) * targetT;

    let suggestedType = '';
    let typeDescription = '';

    if (availL >= totalRunLength && availW >= stairW) {
        suggestedType = 'درج مستقيم (شحط واحد)';
        typeDescription = 'المساحة الطولية كافية جداً لعمل الدرج بشكل مستقيم بقلبة واحدة بدون صحن استدارة.';
    } else if (availW >= (stairW * 2) && availL >= (((totalSteps / 2) - 1) * targetT) + stairW) {
        suggestedType = 'درج قلبتين (حرف U)';
        typeDescription = 'المساحة الطولية غير كافية لدرج مستقيم، ولكن العرض كافي لعمل قلبة مزدوجة مع صحن وسطي.';
    } else if ((availL + availW - stairW) >= totalRunLength) {
        suggestedType = 'درج زاوية (حرف L)';
        typeDescription = 'المساحة الأنسب هي عمل درج يستدير بزاوية 90 درجة مع صحن استدارة مربع.';
    } else {
        suggestedType = 'درج حلزوني أو إضافة بايات مثلثية';
        typeDescription = 'المساحة ضيقة جداً للدرج التقليدي. يُنصح بعمل درج حلزوني أو درج بمروحة (بايات مثلثية) لتوفير المساحة.';
    }

    let html = `
        <div class="result-grid">
            <div class="result-item">
                <h5>عدد الدرجات (البايات)</h5>
                <span class="res-value">${totalSteps}</span>
                <span class="res-unit">باية</span>
            </div>
            <div class="result-item">
                <h5>ارتفاع القائمة الفعلي</h5>
                <span class="res-value">${(actualRiser * 100).toFixed(1)}</span>
                <span class="res-unit">سم</span>
            </div>
            <div class="result-item">
                <h5>الطول الأفقي الكلي</h5>
                <span class="res-value">${totalRunLength.toFixed(2)}</span>
                <span class="res-unit">متر</span>
            </div>
        </div>
        <div style="margin-top: 15px; padding: 15px; background: rgba(33, 150, 243, 0.1); border-radius: 8px;">
            <h5 style="color: var(--primary); margin-bottom: 5px;">النوع المقترح: ${suggestedType}</h5>
            <p style="font-size: 0.9rem; color: #555;">${typeDescription}</p>
        </div>
    `;

    document.getElementById('stair-result-content').innerHTML = html;
    document.getElementById('stair-result').style.display = 'block';
    
    drawStairDiagram(suggestedType, totalSteps, stairW, totalRunLength);
    saveToHistory("تصميم الدرج", html);
}

function drawStairDiagram(type, steps, width, run) {
    const canvas = document.getElementById('stair-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const primaryColor = '#0284c7';
    const dimColor = '#e11d48'; // Red for dimensions
    
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.05)';

    const drawArrow = (x1, y1, x2, y2) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // Dot at end
        ctx.beginPath();
        ctx.arc(x2, y2, 3, 0, Math.PI * 2);
        ctx.fillStyle = primaryColor;
        ctx.fill();
    };

    const drawDim = (text, x, y, vertical = false) => {
        ctx.save();
        ctx.fillStyle = dimColor;
        ctx.font = 'bold 12px Tajawal, sans-serif';
        ctx.textAlign = 'center';
        if (vertical) {
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(text, 0, 0);
        } else {
            ctx.fillText(text, x, y);
        }
        ctx.restore();
    };

    if (type.includes('مستقيم')) {
        const sw = w * 0.4;
        const sh = h * 0.8;
        const x = (w - sw) / 2;
        const y = (h - sh) / 2;
        ctx.fillRect(x, y, sw, sh);
        ctx.strokeRect(x, y, sw, sh);
        const stepH = sh / steps;
        for (let i = 1; i < steps; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + i * stepH);
            ctx.lineTo(x + sw, y + i * stepH);
            ctx.stroke();
        }
        drawArrow(w/2, y + sh - 10, w/2, y + 10);
        drawDim(run.toFixed(1) + 'm', x - 25, y + sh/2, true);
        drawDim(width.toFixed(1) + 'm', w/2, y + sh + 15);
    } else if (type.includes('حرف U')) {
        const fw = w * 0.3;
        const fh = h * 0.6;
        const lh = h * 0.2;
        const gap = w * 0.1;
        const x = (w - (fw * 2 + gap)) / 2;
        const y = h * 0.1;
        
        ctx.fillRect(x, y, fw * 2 + gap, lh);
        ctx.strokeRect(x, y, fw * 2 + gap, lh);
        ctx.fillRect(x, y + lh, fw, fh);
        ctx.strokeRect(x, y + lh, fw, fh);
        ctx.fillRect(x + fw + gap, y + lh, fw, fh);
        ctx.strokeRect(x + fw + gap, y + lh, fw, fh);
        
        drawArrow(x + fw + gap + fw/2, y + lh + fh - 10, x + fw + gap + fw/2, y + lh + 10);
        drawArrow(x + fw/2, y + lh + 10, x + fw/2, y + lh + fh - 10);
        
        drawDim(width.toFixed(1) + 'm', x + fw/2, y - 5);
        drawDim((run/2).toFixed(1) + 'm', x - 20, y + lh + fh/2, true);
    } else if (type.includes('حرف L')) {
        const fw = w * 0.3;
        const fh1 = h * 0.5;
        const fh2 = w * 0.5;
        const x = w * 0.2;
        const y = h * 0.1;
        
        ctx.fillRect(x, y, fw, fh1);
        ctx.strokeRect(x, y, fw, fh1);
        ctx.fillRect(x, y + fh1, fw, fw);
        ctx.strokeRect(x, y + fh1, fw, fw);
        ctx.fillRect(x + fw, y + fh1, fh2, fw);
        ctx.strokeRect(x + fw, y + fh1, fh2, fw);
        
        drawArrow(x + fw + fh2 - 10, y + fh1 + fw/2, x + fw + 10, y + fh1 + fw/2);
        drawDim(width.toFixed(1) + 'm', x + fw/2, y - 5);
        drawDim((run/2).toFixed(1) + 'm', x - 20, y + fh1/2, true);
    } else {
        const r = w * 0.35;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
            const ang = i * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(w / 2 + Math.cos(ang) * r * 0.2, h / 2 + Math.sin(ang) * r * 0.2);
            ctx.lineTo(w / 2 + Math.cos(ang) * r, h / 2 + Math.sin(ang) * r);
            ctx.stroke();
        }
        drawDim('حلزوني', w/2, h/2 + r + 15);
    }
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

/* --- PDF Export Logic --- */
function exportToPdf(type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
    });

    // Add Tajawal font (base64 or just use standard if not available, 
    // but for Arabic we need a font. jsPDF doesn't support Arabic well without a font.
    // For simplicity, we'll try to use a standard font and hope for the best, 
    // or tell the user we're using a simplified export if fonts are missing.)
    
    doc.setFont("Helvetica"); 
    doc.setFontSize(22);
    doc.setTextColor(2, 132, 199); // primary color
    doc.text("CivilEng Pro Report", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Report Generated: " + new Date().toLocaleString(), 105, 28, { align: 'center' });
    
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);

    let title = "";
    let data = [];
    
    if (type === 'brick') {
        title = "Brick Calculator Report";
        const vals = document.querySelectorAll('#brick-result .res-value');
        data = [
            ["Item", "Value"],
            ["Total Bricks", vals[1].textContent],
            ["Net Volume", vals[4].textContent + " m3"],
            ["Cement Bags", vals[5].textContent],
            ["Sand Volume", vals[6].textContent + " m3"]
        ];
    } else if (type === 'stairs') {
        title = "Stairs Design Report";
        const resDiv = document.getElementById('stair-result-content');
        const items = resDiv.querySelectorAll('div');
        data = [["Property", "Value"]];
        items.forEach(item => {
            const spans = item.querySelectorAll('span');
            if (spans.length >= 2) {
                data.push([spans[0].textContent, spans[1].textContent]);
            }
        });
        
        // Add Canvas Image if possible
        const canvas = document.getElementById('stair-canvas');
        if (canvas) {
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 55, 120, 100, 100);
        }
    } else {
        title = "Calculation Report";
        // General extraction from result-grid
        const activeContainer = document.querySelector('.calculator-container[style*="display: block"]');
        if (activeContainer) {
            const grid = activeContainer.querySelector('.result-grid');
            if (grid) {
                data = [["Label", "Value"]];
                grid.querySelectorAll('.result-item').forEach(item => {
                    const h5 = item.querySelector('h5');
                    const val = item.querySelector('.res-value');
                    const unit = item.querySelector('.res-unit');
                    if (h5 && val) {
                        data.push([h5.textContent, val.textContent + (unit ? " " + unit.textContent : "")]);
                    }
                });
            }
        }
    }

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(title, 20, 45);

    doc.autoTable({
        startY: 50,
        head: [data[0]],
        body: data.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [2, 132, 199] },
        styles: { font: "Helvetica", halign: 'left' }
    });

    doc.save(`CivilEng_${type}_Report.pdf`);
}

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
        "dash-subtitle": "اختر إحدى الحاسبات الهندسية من القائمة الجانبية للبدء بحساب الكميات بدقة عالية.",
        "nav-mix-design": "تصميم الخلطة",
        "nav-rebar-sub": "استبدال الأقطار",
        "nav-unit-conv": "محول الوحدات",
        "nav-stairs": "حاسبة السلالم"
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
        "dash-subtitle": "Select an engineering calculator from the sidebar to start precise quantity estimation.",
        "nav-mix-design": "Mix Design",
        "nav-rebar-sub": "Rebar Substitution",
        "nav-unit-conv": "Unit Converter",
        "nav-stairs": "Stairs Calculator"
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
        "dash-subtitle": "حاسیبەیەکی ئەندازیاری لە لیستی لاتەنیشت هەڵبژێرە بۆ دەستپێکردنی حسابکردنی بڕەکان.",
        "nav-mix-design": "تێکەڵەی کۆنکریت",
        "nav-rebar-sub": "گۆڕینی ئاسن",
        "nav-unit-conv": "گۆڕینی یەکەکان",
        "nav-stairs": "حاسیبەی قادرمە"
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
