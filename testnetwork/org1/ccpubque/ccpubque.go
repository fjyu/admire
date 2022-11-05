package main

import (
    "errors"
    "fmt"
    "encoding/json"

    "github.com/hyperledger/fabric-contract-api-go/contractapi"
    "github.com/hyperledger/fabric-chaincode-go/pkg/cid"
)

// SimpleContract contract for handling writing and reading from the world state
type SimpleContract struct {
    contractapi.Contract
}

// IfInd describes basic details of what makes up a simple integrity reference index
//Insert struct field in alphabetic order => to achieve determinism across languages
// golang keeps the order when marshal to json but doesn't order automatically
type IfInd struct {
        Index          string `json:"Index"`
        Swid           string `json:"Swid"`
}

// publish a new key with value (an integrity referece file index) to the world state
func (sc *SimpleContract) IfPublish(ctx contractapi.TransactionContextInterface, key string, value string) error {

    err := cid.AssertAttributeValue(ctx.GetStub(), "hf.Affiliation", "org1.department1")
    if err != nil {
       return errors.New("This app attribute hf.Affiliation value is not org1.department1")
       // Return an error
    }

    existing, err := ctx.GetStub().GetState(key)

    if err != nil {
        return errors.New("Unable to interact with world state")
    }

    if existing != nil {
        return fmt.Errorf("Cannot create world state pair with key %s. Already exists", key)
    }

    err = ctx.GetStub().PutState(key, []byte(value))

    if err != nil {
        return errors.New("Unable to interact with world state")
    }

    return nil
}

// query the value at key in the world state
func (sc *SimpleContract) IfQuery(ctx contractapi.TransactionContextInterface, key string) (string, error) {
    existing, err := ctx.GetStub().GetState(key)

    if err != nil {
        return "", errors.New("Unable to interact with world state")
    }

    if existing == nil {
        return "", fmt.Errorf("Cannot read world state pair with key %s. Does not exist", key)
    }

    return string(existing), nil
}

// query all the key-values in the world state
func (sc *SimpleContract) IfAll(ctx contractapi.TransactionContextInterface) ([]*IfInd, error) {

   // range query with empty string for startKey and endKey does an
   // open-ended query of all assets in the chaincode namespace.
   resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
   if err != nil {
      return nil, errors.New("Unable to GetStateByRange")
   }
   defer resultsIterator.Close()

   var ifindexies []*IfInd

   // indexies = append(indexies, "before for resultsIterator.HasNext()")
   
   for resultsIterator.HasNext() {
       // indexies = append(indexies, "in for resultsIterator.HasNext()")

       queryResponse, err := resultsIterator.Next()
       if err != nil {
                        return nil, errors.New("Unable to resultsIterator.Next()")
       }
       
       var ifind IfInd
       var strifind = `{"index":"` + string(queryResponse.Value) + `","swid":"` + string(queryResponse.Key) + `"}`
       err = json.Unmarshal([]byte(strifind), &ifind)
       if err != nil {
          return nil, err
       }
       ifindexies = append(ifindexies, &ifind)

       // ifindexies = append(ifindexies, string(queryResponse.Value))
   }

   // indexies = append(indexies, "after for resultsIterator.HasNext()")

   return ifindexies, nil
}
