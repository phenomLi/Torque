import { TorqueWorld } from "./core/interface";
import { BodiesFactory } from "./core/bodiesFactory";
import { Vector } from "./math/vector";
import { Matrix } from "./math/matrix";
import { JointFactory } from "./core/jointFactory";

TorqueWorld.body = BodiesFactory;
TorqueWorld.joint = JointFactory;

TorqueWorld.vector = (x: number, y: number) => new Vector(x, y);
TorqueWorld.matrix = (r1: Vector, r2: Vector) => new Matrix(r1, r2);


export const Torque = TorqueWorld;