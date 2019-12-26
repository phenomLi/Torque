import { TorqueWorld } from "./core/interface";
import { BodiesFactory } from "./core/bodiesFactory";
import { Util } from "./common/util";
import { Vertex } from "./common/vertices";
import { Lines } from "./common/line";
import { Arcs } from "./common/arcs";
import { Vector } from "./math/vector";
import { Matrix } from "./math/matrix";

TorqueWorld['body'] = new BodiesFactory();
TorqueWorld['util'] = Util;
TorqueWorld['math'] = {
    vector: (x: number, y: number) => new Vector(x, y),
    matrix: (row1: Vector, row2: Vector) => new Matrix(row1, row2)
};
TorqueWorld['geometry'] = {
    vertex: Vertex,
    line: Lines,
    arcs: Arcs
};

export const Torque = TorqueWorld;