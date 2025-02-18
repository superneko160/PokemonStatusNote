'use strict';

// レーダチャートの設定
const radarConfig = {
    type: 'radar',
    data: {
        labels: ['H', 'A', 'B', 'S', 'D', 'C'],
        datasets: [createChartData('種族値', [0, 0, 0, 0, 0, 0], SB_CHART_COLOR)]  // 初期値：種族値
    },
    options: {
        elements: {
            line: {
                borderWidth: 3
            }
        }
    },
};
// セレクトボックス
const pokemonSelect = document.getElementById('pokemonSelect');
// ボタン
const switchBtn = document.getElementById('switchBtn');
// 性格、特性、持ち物情報欄
const basicInfoArea = document.getElementById('basicInfoArea');
// わざ情報欄
const moveArea = document.getElementById('moveArea');
// タイプアイコン
const typeIconArea = document.getElementById('typeIconArea');
// テラスタイプアイコン
const teratypeIcon = document.getElementById('teratypeIcon');
// キャンバス
const radarCtx = document.getElementById('radarChart');
// 備考欄
const noteArea = document.getElementById('noteArea');
// テーブルの行
const tableRows = document.querySelectorAll('tbody tr');
// レーダチャート
const radarChart = new Chart(radarCtx, radarConfig);
// ポケモンのデータ
let pokemons = null;

/**
 * ブラウザが読み込まれた最初の1回だけ実行されるイベントリスナ
 */
document.addEventListener('DOMContentLoaded', async () => {
    // ポケモンのデータをファイルから取得し、pokemonsにセット
    pokemons = await loadPokemonData();
    // セレクトボックスに選択肢追加
    pokemons.forEach(pokemon => {
        const option = document.createElement('option');
        option.value = pokemon.id;
        option.text = pokemon.name;
        pokemonSelect.appendChild(option);
    });
    // レーダーチャートとテーブル表示（初期表示はID:1のポケモン）
    displayBasicInfo(1);
    displayChart(1);
    displayTable(1);
    displayNote(1);
});

/**
 * セレクトボックスの変更イベントリスナ
 */
pokemonSelect.addEventListener('change', () => {
    const selectedId = getSelectedPokemonId();
    // セレクトボックス変更時は一旦種族値表示に戻す
    displayBasicInfo(selectedId);
    displayChart(selectedId);
    displayTable(selectedId);
    displayNote(selectedId);
});

/**
 * 切替ボタンのイベントリスナ
 */
switchBtn.addEventListener('click', () => {
    // ポケモンのID取得
    const selectedId = getSelectedPokemonId();
    // 種族値データがセットされているときは、努力値データをセット
    if (radarConfig.data.datasets[0].label === '種族値') {
        displayChart(selectedId, 'EV');
    }
    // 努力値データがセットされているときは、種族値データをセット
    else {
        displayChart(selectedId);
    }
    // レーダーチャートの更新
    radarChart.update();
});

/**
 * ポケモンデータを読み込む
 * @returns {array} ポケモンデータの配列
 */
async function loadPokemonData() {
    const response = await fetch(POKEMONS_FILE);
    return await response.json();
}

/**
 * IDに対応するポケモンデータを取得
 * @param {number} id ポケモンID
 * @returns {object} ポケモンデータ
 */
function getPokemonById(id) {
    return pokemons.find(pokemon => pokemon.id === id);
}

/**
 * セレクトボックスで選択された値を取得
 * @returns {number} ポケモンID
 */
function getSelectedPokemonId() {
    return parseInt(pokemonSelect.value, 10);
}

/**
 * 基本情報の表示
 * @param {number} id ポケモンのID
 */
function displayBasicInfo(id) {
    // IDからポケモンのデータ取得
    const pokemon = getPokemonById(id);
    basicInfoArea.textContent = `${pokemon.nature} / ${pokemon.ability} / ${pokemon.item}`;
    moveArea.textContent = `${pokemon.move.join(' / ')}`;
    displayTypes(pokemon);
    displayTeraType(pokemon);
}

/**
 * タイプ表示個所を初期化
 */
function resetTypes() {
    const imgs = document.querySelectorAll('#typeIconArea img');
    imgs.forEach(img => {
        img.remove();
    });
}

/**
 * ポケモンのタイプ表示
 * @param {number} pokemon ポケモン
 */
function displayTypes(pokemon) {
    resetTypes();
    pokemon.types.forEach(type => {
        const img = document.createElement('img');
        img.src = `data/typeicon/${type}.svg`;
        img.classList.add('inline-block', 'w-8', 'mr-1');
        typeIconArea.appendChild(img);
    });
}

/**
 * ポケモンのテラスタイプ表示
 * @param {number} pokemon ポケモン
 */
function displayTeraType(pokemon) {
    teratypeIcon.src = `data/typeicon/${pokemon.teratype}.svg`;
}

/**
 * レーダーチャートの表示
 * @param {number} id ポケモンID
 * @param {string} chartMode チャートの表示形式（SB:種族値（初期値）、EV:努力値）
 */
function displayChart(id, chartMode = 'SB') {
    // IDからポケモンのデータ取得
    const pokemon = getPokemonById(id);
    // 種族値のレーダーチャート設定
    if (chartMode === 'SB') {
        radarConfig.data.datasets = [createChartData('種族値', pokemon.baseStatus, SB_CHART_COLOR)];
    }
    // 努力値のレーダーチャート設定
    else {
        radarConfig.data.datasets = [createChartData('努力値（%）', pokemon.effortValues.map(value => (value / MAX_EFFORT_VALUE) * 100), EV_CHART_COLOR)];
    }
    // レーダーチャートの更新
    radarChart.update();
}

/**
 * テーブルの表示
 * @param {number} id ポケモンID
 */
function displayTable(id) {
    // IDからポケモンのデータ取得
    const pokemon = getPokemonById(id);
    // 性格補正を行うインデックス取得（無補正：[0, 0]）
    const natureCorrectionIndexes = NATURES[pokemon.nature] || [0, 0];
    // 各行にデータを表示
    tableRows.forEach((row, index) => {
        row.children[1].textContent = pokemon.baseStatus[index];
        row.children[2].textContent = pokemon.effortValues[index];
        row.children[3].textContent = 
        `${calcActualValue(index, pokemon.baseStatus[index], pokemon.individualValues[index], pokemon.effortValues[index], natureCorrectionIndexes)} (${pokemon.individualValues[index]})`;
        resetClassCorrectionParam(row);
        addClassCorrectionParam(row, index, natureCorrectionIndexes)
    });
}

/**
 * 備考欄の表示
 * @param {number} id ポケモンID
 */
function displayNote(id) {
    // IDからポケモンのデータ取得
    const pokemon = getPokemonById(id);
    noteArea.textContent = `${pokemon.note}`;
}

/**
 * 性格補正パラメータの色のクラスを消去
 * @param {HTMLElement} row 行のHTML要素
 */
function resetClassCorrectionParam(row) {
    const resetClasses = ['text-zinc-700', 'text-red-500', 'text-blue-500'];
    resetClasses.forEach(className => {
        row.classList.remove(className);
    });
}

/**
 * 性格補正パラメータの色のクラスを追加
 * @param {HTMLElement} row 行のHTML要素
 * @param {number} index 現在の行数
 * @param {array} natureCorrectionIndexes 性格補正インデックスのデータ
 */
function addClassCorrectionParam(row, index, natureCorrectionIndexes) {
    row.classList.add(getClassCorrectionParam(index, natureCorrectionIndexes));
}

/**
 * 性格補正パラメータの色を変更するクラス名を取得
 * @param {number} index 現在の行数
 * @param {array} natureCorrectionIndexes 性格補正インデックスのデータ
 * @returns {string} クラス名（テキストカラー）
 */
function getClassCorrectionParam(index, natureCorrectionIndexes) {
    const [upCorrectIndex, downCorrectIndex] = natureCorrectionIndexes;
    const corrections = {
        0: 'text-zinc-700',
        [upCorrectIndex]: 'text-red-500',
        [downCorrectIndex]: 'text-blue-500',
    };
    return corrections[index] || 'text-zinc-700';
}

/**
 * レーダーチャートのデータ生成
 * @param {string} label ラベル
 * @param {array} data ポケモンの数値データ(example: [252, 4, 252, 0, 0, 0])
 * @param {string} color RGB(example: '255, 255, 255')
 * @returns {object} レーダーチャート設定用データ
 */
function createChartData(label, data, color) {
    return {
        label: label,
        data: switchDataCS(data),  // CSを入れ替えたデータを利用
        fill: true,
        backgroundColor: `rgba(${color}, 0.2)`,
        borderColor: `rgb(${color})`,
        pointBackgroundColor: `rgb(${color})`,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: `rgb(${color})`
    };
}

/**
 * ポケモンのデータのCとSの値を入れ替えたデータを作成
 * @param {array} data ポケモンの数値データ(example: [252, 4, 252, 0, 0, 0])
 * @returns {array} CSを入れ替えたポケモンの数値データ(example: [252, 4, 252, 0, 0, 0])
 */
function switchDataCS(data) {
    return [data[0], data[1], data[2], data[5], data[4], data[3]];
}

/**
 * 実数値を計算
 * @param {number} index インデックス番号(0:H、1:A...)
 * @param {number} baseStatus 種族値
 * @param {number} individualValue 個体値
 * @param {number} effortValue 努力値
 * @param {array} natureCorrectionIndexes 性格補正するインデックス(example: [1, 2])
 * @returns {number} 実数値
 */
function calcActualValue(index, baseStatus, individualValue, effortValue, natureCorrectionIndexes) {
    // H実数値計算
    if (index === 0) {
        // H = (種族値 + 個体値 / 2 + 努力値 / 8) + 60
        return Math.trunc((baseStatus + (individualValue / 2) + (effortValue / 8)) + 60);
    }
    // ABCDS実数値計算
    // ABCDS = {(種族値 + 個体値 / 2 + 努力値 / 8) + 5} * 性格補正
    return Math.trunc((baseStatus + (individualValue / 2) + (effortValue / 8) + 5) * getNatureCorrection(index, natureCorrectionIndexes));
}

/**
 * 性格補正を行う数値を取得
 * @param {number} index 現在のインデックス
 * @param {array} natureCorrections 補正を行う必要のあるインデックスのデータ（[上昇補正するパラメータのインデックス, 下降補正するパラメータのインデックス]）
 * @returns {number} 補正数値（1.1 or 1 or 0.9）
 */
function getNatureCorrection(index, natureCorrectionIndexes) {
    const [upCorrectIndex, downCorrectIndex] = natureCorrectionIndexes;
    const corrections = {
        0: 1,
        [upCorrectIndex]: 1.1,
        [downCorrectIndex]: 0.9,
    };
    return corrections[index] || 1;
}
