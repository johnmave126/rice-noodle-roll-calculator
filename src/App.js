import React, { useState } from 'react';
import './App.css';

// scale of unit/base
const SCALE = {
    /* Baseline */
    'mm': 1,
    'g': 1,
    'mL': 1,
    'mm^3': 0.001,

     /* Others */
    'cm': 10,
    'inch': 25.4,
    'oz': 28.3495,
    'tsp': 4.929,
    'tbsp': 14.79,
    'cup': 236.6
};

// unit: g/mL
const STARCH_RHO = 0.561949898;
const WATER_RHO = 1;
// water-to-starch volume ratio
const RATIO = {
    'Steam': 1.3,
    'Microwave': 1 // TODO: Find optimal ratio
};
// the extra ratio to multiply to water volume to counter water loss
const EVAPORATE_COMPENSATE = {
    'Steam': 1,
    'Microwave': 1 // TODO: Find optimal ratio
};

function round(v) {
    return Math.round(v * 1000) / 1000;
}

function UnitSelector(props) {
    const options = props.availableUnits.map((u) => 
        <option value={u} key={u}>{u}</option>
    );
    return (
        <select className="custom-select" value={props.unit} onChange={(e) => props.setUnit(e.target.value)}>
            {options}
        </select>
    );
}

function UnitInput(props) {
    const [unit, setUnit] = useState(props.defaultUnit);
    return (
        <div className="input-group">
            <input
                type="number"
                min="0"
                id={props.id}
                step="0.001"
                className="form-control"
                value={round(props.value / SCALE[unit])}
                onChange={(e) => props.setValue(parseFloat(e.target.value) * SCALE[unit])}
                disabled={props.disabled}
            />
            <div className="input-group-append">
                <UnitSelector unit={unit} setUnit={setUnit} availableUnits={props.availableUnits} />
            </div>
        </div>
    );
}

function LengthInput(value, setValue, defaultUnit, id) {
    return <UnitInput
        value={value}
        setValue={setValue}
        defaultUnit={defaultUnit}
        availableUnits={['mm', 'cm', 'inch']}
        id={id}
    />;
}

function VolumeLabel(value, defaultUnit) {
    return <UnitInput
        value={value}
        defaultUnit={defaultUnit}
        availableUnits={['mL', 'tsp', 'tbsp', 'cup']}
        disabled={true}
    />;
}

function MassLabel(value, defaultUnit) {
    return <UnitInput
        value={value}
        defaultUnit={defaultUnit}
        availableUnits={['g', 'oz']}
        disabled={true}
    />;
}

function RoundPlate(props) {
    const [diameter, setDiameter] = useState(6 * SCALE['inch']);
    props.setArea(Math.PI * diameter * diameter / 4);
    return (
        <div className="form-row">
            <div className="col-md-4 mb-3">
                <label htmlFor="plate-radius">Diameter</label>
                { LengthInput(diameter, setDiameter, 'inch', 'plate-radius') }
            </div>
        </div>
    );
}
function SquareContainer(props) {
    const [width, setWidth] = useState(125);
    const [length, setLength] = useState(185);
    props.setArea(width * length);
    return (
        <div className="form-row">
            <div className="col-md-4 mb-3">
                <label htmlFor="container-width">Width</label>
                { LengthInput(width, setWidth, 'cm', 'container-width') }
            </div>
            <div className="col-md-4 mb-3">
                <label htmlFor="container-length">Length</label>
                { LengthInput(length, setLength, 'cm', 'container-length') }
            </div>
        </div>
    );
}

function ContainerConfigRow(container, setArea) {
    if(container === 'Plate') {
        return <RoundPlate setArea={setArea} />;
    }
    else {
        return <SquareContainer setArea={setArea} />;
    }
}

function generateBtnOptions(name, options, activeOption, setActiveOption) {
    return options.map((o) => {
        const isActive = o === activeOption;
        let labelCss = "btn btn-primary";
        if(isActive) {
            labelCss += " active";
        }
        return (
            <label className={labelCss} key={o}>
                <input
                    type="radio"
                    name={name}
                    value={o}
                    autoComplete="off"
                    checked={isActive}
                    onChange={(e) => setActiveOption(e.target.value)}
                />
                { o }
            </label>
        );
    });
}

function reportAmount(area, thickness, metric, method) {
    // TODO: remove this after optimal ratio for microwave is found
    if(method === 'Microwave') {
        return <p><strong>Not supported at the moment.</strong></p>;
    }
    const finalWaterVolume = area * thickness * SCALE['mm^3'];
    const starchVolume = finalWaterVolume / RATIO[method];
    const waterVolume = finalWaterVolume * EVAPORATE_COMPENSATE[method];
    console.log(waterVolume);
    if(metric === 'Volume') {
        return (
            <div className="form-row" key="volume-report">
                <div className="col-md-4 mb-3">
                    <label>Starch Volume</label>
                    { VolumeLabel(starchVolume, 'tbsp') }
                </div>
                <div className="col-md-4 mb-3">
                    <label>Water Volume</label>
                    { VolumeLabel(waterVolume, 'tbsp') }
                </div>
            </div>
        );
    }
    else {
        const starchMass = starchVolume * STARCH_RHO;
        const waterMass = waterVolume * WATER_RHO;
        console.log(waterMass);
        return (
            <div className="form-row" key="mass-report">
                <div className="col-md-4 mb-3">
                    <label>Starch Mass</label>
                    { MassLabel(starchMass, 'g') }
                </div>
                <div className="col-md-4 mb-3">
                    <label>Water Mass</label>
                    { MassLabel(waterMass, 'g') }
                </div>
            </div>
        );
    }
}

function App() {
    const [container, setContainer] = useState('Plate');
    const [area, setArea] = useState(0);
    const [thickness, setThickness] = useState(7);

    const [metric, setMetric] = useState('Volume');
    const [method, setMethod] = useState('Steam');

    const containerBtns = generateBtnOptions('container-selector', ['Plate', 'Bento Box'], container, setContainer);
    const metricBtns = generateBtnOptions('metric-selector', ['Volume', 'Mass'], metric, setMetric);
    const methodBtns = generateBtnOptions('method-selector', ['Steam', 'Microwave'], method, setMethod);

    const containerConfigRow = ContainerConfigRow(container, setArea);
    return (
        <div>
            <div className="text-center">
                <h1>Rice Noodle Roll Calculator</h1>
            </div>
            <div>
                <h4>Reference Sizes</h4>
                <ul>
                    <li>Small Plate: 6in. diameter</li>
                    <li>Large Plate: 8in. diameter</li>
                    <li>Small Bento Box: 9cm x 15cm </li>
                    <li>Large Bento Box: 12.5cm x 18.5cm</li>
                </ul>
            </div>
            <div>
                <h4>Configuration</h4>
                <div className="form-row">
                    <div className="col-md-4 mb-3">
                        <label className="d-block" htmlFor="container-selector">Container Type</label>
                        <div className="btn-group btn-group-toggle" data-toggle="buttons">
                            { containerBtns }
                        </div>
                    </div>
                </div>
                { containerConfigRow }
                <div className="form-row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="thickness">Desired Thickness</label>
                        { LengthInput(thickness, setThickness, 'mm', 'thickness') }
                    </div>
                </div>
            </div>
            <div>
                <h4>Amount</h4>
                <div className="form-row">
                    <div className="col-md-4 mb-3">
                        <label className="d-block" htmlFor="metric-selector">Measure</label>
                        <div className="btn-group btn-group-toggle" data-toggle="buttons">
                            { metricBtns }
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <label className="d-block" htmlFor="method-selector">Cooking Method</label>
                        <div className="btn-group btn-group-toggle" data-toggle="buttons">
                            { methodBtns }
                        </div>
                    </div>
                </div>
                { reportAmount(area, thickness, metric, method) }
            </div>
        </div>
    );
}

export default App;
