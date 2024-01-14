'use strict';

// ポケモンデータのパス
const POKEMONS_FILE = 'data/pokemons.json';
// 最大努力値
const MAX_EFFORT_VALUE = 252;
// レーダチャートの設定
const radarConfig = {
    type: 'radar',
    data: {
        labels: ['H', 'A', 'B', 'S', 'D', 'C'],
        datasets: [createChartData('種族値', [], '255, 99, 132')]  // 初期値：種族値
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
// キャンバス
const radarCtx = document.getElementById('radarChart');
// レーダチャート
const radarChart = new Chart(radarCtx, radarConfig);

/**
 * ブラウザが読み込まれた最初の1回だけ実行されるイベントリスナ
 */
document.addEventListener('DOMContentLoaded', async () => {
    // ポケモンのデータをファイルから取得
    const response = await fetch(POKEMONS_FILE);
    const data = await response.json();
    // セレクトボックスに選択肢追加
    data.forEach(pokemon => {
        const option = document.createElement('option');
        option.value = pokemon.id;
        option.text = pokemon.name;
        pokemonSelect.appendChild(option);
    });
    // レーダーチャート表示
    await loadAndDisplayPokemonData(1);  // 初期表示はID:1のポケモン
});

// セレクトボックスの変更イベントリスナ
pokemonSelect.addEventListener('change', async () => {
    const selectedId = getSelectedPokemonId();
    // セレクトボックス変更時は一旦種族値表示に戻す
    await loadAndDisplayPokemonData(selectedId);
});

/**
 * 切替ボタンのイベントリスナ
 */
switchBtn.addEventListener('click', async () => {
    // ポケモンのID取得
    const selectedId = getSelectedPokemonId();
    // 種族値データがセットされているときは、努力値データをセット
    if (radarConfig.data.datasets[0].label === '種族値') {
        loadAndDisplayPokemonData(selectedId, 'EV');
    }
    // 努力値データがセットされているときは、種族値データをセット
    else {
        loadAndDisplayPokemonData(selectedId);
    }
    // レーダーチャートの更新
    radarChart.update();
});

/**
 * セレクトボックスで選択された値を取得
 * @returns number ポケモンID
 */
function getSelectedPokemonId() {
    return parseInt(pokemonSelect.value, 10);
}

/**
 * レーダーチャートの更新
 * @param number id ポケモンID
 * @param string chartMode チャートの表示形式（SB:種族値（初期値）、EV:努力値）
 */
async function loadAndDisplayPokemonData(id, chartMode = 'SB') {
    // IDからポケモンのデータ取得
    const pokemon = await loadPokemonData(id);
    // 種族値のレーダーチャート設定
    if (chartMode === 'SB') {
        radarConfig.data.datasets = [createChartData('種族値', pokemon.baseStatus, '255, 99, 132')];
    }
    // 努力値のレーダーチャート設定
    else {
        radarConfig.data.datasets = [createChartData('努力値（%）', pokemon.effortValues.map(value => (value / MAX_EFFORT_VALUE) * 100), '54, 162, 235')];
    }
    // レーダーチャートの更新
    radarChart.update();
}

/**
 * ファイルからポケモンのデータを読み込む
 * @param number id ポケモンID
 * @returns array selectedPokemon 選択されたポケモンのデータ
 */
async function loadPokemonData(id) {
    // ポケモンのデータ取得
    const response = await fetch(POKEMONS_FILE);
    const data = await response.json();
    // IDと一致するポケモンのデータを選択
    const selectedPokemon = data.find(pokemon => pokemon.id === id);
    // 取得したデータを返す
    return selectedPokemon;
}

/**
 * レーダーチャートのデータ生成
 * @param string label ラベル
 * @param array data ポケモンのデータ
 * @param string color RGB(example: '255, 255, 255')
 */
function createChartData(label, data, color) {
    return {
        label: label,
        data: data,
        fill: true,
        backgroundColor: `rgba(${color}, 0.2)`,
        borderColor: `rgb(${color})`,
        pointBackgroundColor: `rgb(${color})`,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: `rgb(${color})`
    };
}