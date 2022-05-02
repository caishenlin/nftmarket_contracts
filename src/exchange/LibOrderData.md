#### Features

`Order` data can be generic. `dataType` field defines format of that data.

LibOrderData defines function parse which parses data field (according to dataType) and converts any version of the data to the latest supported by contract. 
(see [LibOrder](LibOrder.md) `Order.data` field)


see contracts/LibOrderData.sol
Order data can be set either empty = 0xffffffff
or ORDER_DATA_V1
if its set to ORDER_DATA_V1
it can handle payouts and origin fees
see also contracts/LibOrderDataV1.sol

