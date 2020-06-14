import { TorqueWorld } from "./core/interface";
import { BodiesFactory } from "./core/bodiesFactory";
import { Util } from "./common/util";
import { Lines } from "./common/line";
import { Arcs } from "./common/arcs";
import { Vector } from "./math/vector";

TorqueWorld['body'] = new BodiesFactory();
TorqueWorld['util'] = Util;
TorqueWorld['math'] = {
    vector: (x: number, y: number) => new Vector(x, y)
};
TorqueWorld['geometry'] = {
    vertex: Vector,
    line: Lines,
    arcs: Arcs
};

export const Torque = TorqueWorld;