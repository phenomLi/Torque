import { TorqueWorld } from "./core/interface";
import { BodiesFactory } from "./core/bodiesFactory";
import { Vector } from "./math/vector";

TorqueWorld['body'] = new BodiesFactory();
TorqueWorld['math'] = {
    vector: (x: number, y: number) => new Vector(x, y)
};

export const Torque = TorqueWorld;