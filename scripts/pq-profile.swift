import CoreGraphics
import Foundation

let data = CGColorSpace(name: CGColorSpace.itur_2100_PQ)!.copyICCData()! as Data
try data.write(to: URL(fileURLWithPath: CommandLine.arguments[1]), options: .atomic)
