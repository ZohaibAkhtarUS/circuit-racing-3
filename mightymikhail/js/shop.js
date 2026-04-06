// ============================================================
// MIGHTY MIKHAIL - Shop System (Skins + Upgrades)
// ============================================================

const Shop = {
    // Load shop data from localStorage
    load() {
        try {
            const saved = localStorage.getItem('mightyMikhailShop');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return { equippedSkin: 'classic', ownedSkins: ['classic'], upgrades: {}, coins: 0 };
    },

    save(data) {
        try {
            localStorage.setItem('mightyMikhailShop', JSON.stringify(data));
        } catch (e) {}
    },

    getCoins() {
        const data = this.load();
        // Also merge coins from game progress
        const progress = loadProgress();
        return (data.coins || 0) + (progress.coins || 0);
    },

    setCoins(amount) {
        const data = this.load();
        data.coins = amount;
        this.save(data);
        // Reset progress coins since we track in shop now
        const progress = loadProgress();
        progress.coins = 0;
        saveProgress(progress);
    },

    addCoins(amount) {
        this.setCoins(this.getCoins() + amount);
    },

    // Buy a skin
    buySkin(skinId) {
        const skin = SHOP_SKINS.find(s => s.id === skinId);
        if (!skin) return false;

        const data = this.load();
        if (data.ownedSkins.includes(skinId)) return false;

        const totalCoins = this.getCoins();
        if (totalCoins < skin.cost) return false;

        data.ownedSkins.push(skinId);
        this.save(data);
        this.setCoins(totalCoins - skin.cost);
        return true;
    },

    // Equip a skin
    equipSkin(skinId) {
        const data = this.load();
        if (!data.ownedSkins.includes(skinId)) return false;
        data.equippedSkin = skinId;
        this.save(data);
        this.applySkin(skinId);
        return true;
    },

    // Apply skin colors to MIKHAIL object
    applySkin(skinId) {
        const skin = SHOP_SKINS.find(s => s.id === skinId);
        if (!skin) return;
        MIKHAIL.suit = skin.suit;
        MIKHAIL.suitLight = skin.suitLight;
        MIKHAIL.cape = skin.cape;
        MIKHAIL.capeShade = skin.capeShade;
        MIKHAIL.boots = skin.boots;
        MIKHAIL.star = skin.star;
    },

    // Buy an upgrade
    buyUpgrade(upgradeId) {
        const upg = SHOP_UPGRADES.find(u => u.id === upgradeId);
        if (!upg) return false;

        const data = this.load();
        const currentLevel = data.upgrades[upgradeId] || 0;
        if (currentLevel >= upg.maxLevel) return false;

        const totalCoins = this.getCoins();
        const cost = upg.cost * (currentLevel + 1); // Costs scale with level
        if (totalCoins < cost) return false;

        data.upgrades[upgradeId] = currentLevel + 1;
        this.save(data);
        this.setCoins(totalCoins - cost);
        return true;
    },

    getUpgradeLevel(upgradeId) {
        const data = this.load();
        return data.upgrades[upgradeId] || 0;
    },

    getUpgradeCost(upgradeId) {
        const upg = SHOP_UPGRADES.find(u => u.id === upgradeId);
        if (!upg) return 0;
        const currentLevel = this.getUpgradeLevel(upgradeId);
        return upg.cost * (currentLevel + 1);
    },

    // Apply all upgrades to a player object
    applyUpgrades(player) {
        const data = this.load();
        const upgrades = data.upgrades || {};

        // HP
        const hpLvl = upgrades.hp || 0;
        player.maxHp = 100 + hpLvl * 25;
        player.hp = player.maxHp;

        // Energy (stored as baseEnergy for reference)
        const enLvl = upgrades.energy || 0;
        player.maxEnergy = ENERGY_MAX + enLvl * 25;
        player.energy = player.maxEnergy;

        // Laser damage
        const laserLvl = upgrades.laser || 0;
        player.baseLaserDamage = 15 + laserLvl * 5;

        // Speed
        const spdLvl = upgrades.speed || 0;
        player.baseSpeedMultiplier = 1 + spdLvl * 0.1;
        player.speedMultiplier = player.baseSpeedMultiplier;

        // Booster fuel
        const fuelLvl = upgrades.fuel || 0;
        player.maxFuel = BOOSTER_FUEL_MAX + fuelLvl * 25;
        player.boosterFuel = player.maxFuel;
    },

    // Apply equipped skin
    applyEquippedSkin() {
        const data = this.load();
        this.applySkin(data.equippedSkin || 'classic');
    },

    // Build the shop UI
    buildShopUI() {
        const data = this.load();
        const totalCoins = this.getCoins();

        // Skins section
        const skinsContainer = document.getElementById('shop-skins');
        skinsContainer.innerHTML = '';

        for (const skin of SHOP_SKINS) {
            const owned = data.ownedSkins.includes(skin.id);
            const equipped = data.equippedSkin === skin.id;

            const card = document.createElement('div');
            card.className = 'shop-item' + (equipped ? ' equipped' : '') + (!owned && totalCoins < skin.cost ? ' cant-afford' : '');

            // Preview swatch
            const swatch = document.createElement('div');
            swatch.className = 'skin-swatch';
            swatch.innerHTML = `<div style="width:20px;height:20px;border-radius:4px;background:${skin.suit};display:inline-block;margin:2px;"></div>` +
                `<div style="width:20px;height:20px;border-radius:4px;background:${skin.cape};display:inline-block;margin:2px;"></div>`;
            card.appendChild(swatch);

            const name = document.createElement('div');
            name.className = 'shop-item-name';
            name.textContent = skin.name;
            card.appendChild(name);

            const btn = document.createElement('button');
            btn.className = 'shop-btn';
            if (equipped) {
                btn.textContent = 'EQUIPPED';
                btn.disabled = true;
            } else if (owned) {
                btn.textContent = 'EQUIP';
                btn.onclick = () => {
                    this.equipSkin(skin.id);
                    playSound('select');
                    this.buildShopUI();
                };
            } else {
                btn.textContent = skin.cost + ' coins';
                if (totalCoins < skin.cost) btn.disabled = true;
                btn.onclick = () => {
                    if (this.buySkin(skin.id)) {
                        this.equipSkin(skin.id);
                        playSound('powerup');
                        this.buildShopUI();
                    }
                };
            }
            card.appendChild(btn);
            skinsContainer.appendChild(card);
        }

        // Upgrades section
        const upgradesContainer = document.getElementById('shop-upgrades');
        upgradesContainer.innerHTML = '';

        for (const upg of SHOP_UPGRADES) {
            const level = this.getUpgradeLevel(upg.id);
            const maxed = level >= upg.maxLevel;
            const cost = this.getUpgradeCost(upg.id);

            const card = document.createElement('div');
            card.className = 'shop-item' + (maxed ? ' maxed' : '') + (!maxed && totalCoins < cost ? ' cant-afford' : '');

            const icon = document.createElement('div');
            icon.className = 'shop-item-icon';
            icon.textContent = upg.icon;
            card.appendChild(icon);

            const name = document.createElement('div');
            name.className = 'shop-item-name';
            name.textContent = upg.name;
            card.appendChild(name);

            // Level pips
            const pips = document.createElement('div');
            pips.className = 'upgrade-pips';
            for (let i = 0; i < upg.maxLevel; i++) {
                const pip = document.createElement('span');
                pip.className = 'pip' + (i < level ? ' filled' : '');
                pips.appendChild(pip);
            }
            card.appendChild(pips);

            const desc = document.createElement('div');
            desc.className = 'shop-item-desc';
            desc.textContent = maxed ? 'MAX!' : upg.desc;
            card.appendChild(desc);

            const btn = document.createElement('button');
            btn.className = 'shop-btn';
            if (maxed) {
                btn.textContent = 'MAXED';
                btn.disabled = true;
            } else {
                btn.textContent = cost + ' coins';
                if (totalCoins < cost) btn.disabled = true;
                btn.onclick = () => {
                    if (this.buyUpgrade(upg.id)) {
                        playSound('powerup');
                        this.buildShopUI();
                    }
                };
            }
            card.appendChild(btn);
            upgradesContainer.appendChild(card);
        }

        // Coins display
        document.getElementById('shop-coins').textContent = totalCoins + ' coins';
    },
};
