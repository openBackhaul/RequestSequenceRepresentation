'use strict';

const ServiceUtils = require('onf-core-model-ap-bs/basicServices/utility/LogicalTerminationPoint');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const prepareForwardingAutomation = require('onf-core-model-ap-bs/basicServices/services/PrepareForwardingAutomation');

const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const tcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');

const eventDispatcher = require('onf-core-model-ap/applicationPattern/rest/client/eventDispatcher');

const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const operationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');

/**
 * Embed yourself into the MBH SDN application layer
 *
 * body V1_embedyourself_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.embedYourself = async function (body, user, xCorrelator, traceIndicator, customerJourney, operationServerName) {
  let registryOfficeApplicationName = body["registry-office-application"];
  let registryOfficeReleaseNumber = body["registry-office-application-release-number"];
  let registryOfficeProtocol = body["registry-office-protocol"];
  let registryOfficeAddress = body["registry-office-address"];
  let registryOfficePort = body["registry-office-port"];
  let deregisterOperation = body["deregistration-operation"];
  let relayOperationUpdateOperation = body["relay-operation-update-operation"];
  let relayServerReplacementOperation = body["relay-server-replacement-operation"];

  /****************************************************************************************
   * Prepare logicalTerminationPointConfigurationInput object to
   * configure logical-termination-point
   ****************************************************************************************/

  let ltpConfigurationList = [];
  // update the registryOffice configuration
  let relayServerReplacementForwarding = "PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement";
  let relayOperationUpdate = "PromptingNewReleaseForUpdatingServerCausesRequestForBroadcastingInfoAboutBackwardCompatibleUpdateOfOperation";
  let deregisterApplication = "PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease";

  let registryOfficeClientUuidStack = await ServiceUtils.resolveClientUuidStackFromForwardingAsync(relayServerReplacementForwarding);
  let relayOperationUpdateOperationClientUuid = await ServiceUtils.resolveOperationClientUuidFromForwardingAsync(relayOperationUpdate);
  let deregisterApplicationOperationClientUuid = await ServiceUtils.resolveOperationClientUuidFromForwardingAsync(deregisterApplication);
  if(registryOfficeClientUuidStack){
    let isRoApplicationNameUpdated = false;
    let isRoReleaseNumberUpdated = false;
    let isRoAddressUpdated = false;
    let isRoPortUpdated = false;
    let isRoProtocolUpdated = false;
    let isRoRelayServerReplacementOperationUpdated = false;
  let existingRegistryOfficeApplicationName = await httpClientInterface.getApplicationNameAsync(registryOfficeClientUuidStack.httpClientUuid);
  let existingRegistryOfficeReleaseNumber = await httpClientInterface.getReleaseNumberAsync(registryOfficeClientUuidStack.httpClientUuid);
  let existingRegistryOfficeAddress = await tcpClientInterface.getRemoteAddressAsync(registryOfficeClientUuidStack.tcpClientUuid);
  let existingRegistryOfficePort = await tcpClientInterface.getRemotePortAsync(registryOfficeClientUuidStack.tcpClientUuid);
  let existingRegistryOfficeProtocol = await tcpClientInterface.getRemoteProtocolAsync(registryOfficeClientUuidStack.tcpClientUuid);
  let exsitingRegistryOfficeRelayServerReplacementOperation = await operationClientInterface.getOperationNameAsync(registryOfficeClientUuidStack.operationClientUuid);  
  if (registryOfficeApplicationName != existingRegistryOfficeApplicationName) {
    isRoApplicationNameUpdated = await httpClientInterface.setApplicationNameAsync(
      registryOfficeClientUuidStack.httpClientUuid,
      registryOfficeApplicationName);
  }
  if (registryOfficeReleaseNumber != existingRegistryOfficeReleaseNumber) {
    isRoReleaseNumberUpdated = await httpClientInterface.setReleaseNumberAsync(
      registryOfficeClientUuidStack.httpClientUuid,
      registryOfficeReleaseNumber);
  }
  if (JSON.stringify(registryOfficeAddress) != JSON.stringify(existingRegistryOfficeAddress)) {
    isRoAddressUpdated = await tcpClientInterface.setRemoteAddressAsync(
      registryOfficeClientUuidStack.tcpClientUuid,
      registryOfficeAddress);
  }
  if (registryOfficePort != existingRegistryOfficePort) {
    isRoPortUpdated = await tcpClientInterface.setRemotePortAsync(
      registryOfficeClientUuidStack.tcpClientUuid,
      registryOfficePort);
  }
  if (registryOfficeProtocol != existingRegistryOfficeProtocol) {
    isRoProtocolUpdated = await tcpClientInterface.setRemoteProtocolAsync(
      registryOfficeClientUuidStack.tcpClientUuid,
      registryOfficeProtocol);
  }
  if (relayServerReplacementOperation != exsitingRegistryOfficeRelayServerReplacementOperation) {
    isRoRelayServerReplacementOperationUpdated = await operationClientInterface.setOperationNameAsync(
      registryOfficeClientUuidStack.operationClientUuid,
      relayServerReplacementOperation);
  }
  if (isRoApplicationNameUpdated || isRoReleaseNumberUpdated) {
    ltpConfigurationList.push(registryOfficeClientUuidStack.httpClientUuid);
  }
  if (isRoAddressUpdated || isRoPortUpdated || isRoProtocolUpdated) {
    ltpConfigurationList.push(registryOfficeClientUuidStack.tcpClientUuid);
  }
  if (isRoRelayServerReplacementOperationUpdated) {
    ltpConfigurationList.push(registryOfficeClientUuidStack.operationClientUuid);
  }
}
  if(relayOperationUpdateOperationClientUuid) {
    let isRoRelayOperationUpdateOperationUpdated = false;
  let exsitingRegistryOfficeRelayOperationUpdateOperation = await operationClientInterface.getOperationNameAsync(relayOperationUpdateOperationClientUuid);
  if (relayOperationUpdateOperation != exsitingRegistryOfficeRelayOperationUpdateOperation) {
    isRoRelayOperationUpdateOperationUpdated = await operationClientInterface.setOperationNameAsync(
      relayOperationUpdateOperationClientUuid,
      relayOperationUpdateOperation);
      if (isRoRelayOperationUpdateOperationUpdated) {
        ltpConfigurationList.push(relayOperationUpdateOperationClientUuid);
      }   
  }

  let exsitingRegistryOfficeDeregisterApplicationOperation = await operationClientInterface.getOperationNameAsync(deregisterApplicationOperationClientUuid);

  }
 
  if(deregisterApplicationOperationClientUuid){
  let isRoDeregisterApplicationOperationUpdated = false;
  if (deregisterOperation != exsitingRegistryOfficeDeregisterApplicationOperation) {
    isRoDeregisterApplicationOperationUpdated = await operationClientInterface.setOperationNameAsync(
      deregisterApplicationOperationClientUuid,
      deregisterOperation);
  }
  if (isRoDeregisterApplicationOperationUpdated) {
    ltpConfigurationList.push(deregisterApplicationOperationClientUuid);
  }
  }
 



 
  
  
  

  /***********************************************************************
   * oldRelease information to be updated if provided in the requestBody
   ***********************************************************************/

  let oldApplicationNameInConfiguration;
  let beaqueathYourDataAndDieForwardingName = "PromptForEmbeddingCausesRequestForBequeathingData";
  let isOldReleaseExist = await isForwardingNameExist(beaqueathYourDataAndDieForwardingName);

  if (isOldReleaseExist) {
    let preceedingApplicationClientUuidStack = await ServiceUtils.resolveClientUuidStackFromForwardingAsync(beaqueathYourDataAndDieForwardingName);

    oldApplicationNameInConfiguration = await httpClientInterface.getApplicationNameAsync(preceedingApplicationClientUuidStack.httpClientUuid)
    let existingpreceedingApplicationAddress = await tcpClientInterface.getRemoteAddressAsync(preceedingApplicationClientUuidStack.tcpClientUuid);
    let existingpreceedingApplicationPort = await tcpClientInterface.getRemotePortAsync(preceedingApplicationClientUuidStack.tcpClientUuid);
    let existingpreceedingApplicationProtocol = await tcpClientInterface.getRemoteProtocolAsync(preceedingApplicationClientUuidStack.tcpClientUuid);

    let isORAddressUpdated = false;
    let isORPortUpdated = false;
    let isORProtocolUpdated = false;

    let oldReleaseAddress = body["old-release-address"];
    let oldReleaseProtocol = body["old-release-protocol"];
    let oldReleasePort = body["old-release-port"];
    if (oldReleaseAddress!=undefined && JSON.stringify(oldReleaseAddress) != JSON.stringify(existingpreceedingApplicationAddress)) {
      isORAddressUpdated = await tcpClientInterface.setRemoteAddressAsync(
        preceedingApplicationClientUuidStack.tcpClientUuid,
        oldReleaseAddress);
    }
    if (oldReleasePort!=undefined && oldReleasePort != existingpreceedingApplicationPort) {
      isORPortUpdated = await tcpClientInterface.setRemotePortAsync(
        preceedingApplicationClientUuidStack.tcpClientUuid,
        oldReleasePort);
    }
    if (oldReleaseProtocol!=undefined && oldReleaseProtocol != existingpreceedingApplicationProtocol) {
      isORProtocolUpdated = await tcpClientInterface.setRemoteProtocolAsync(
        preceedingApplicationClientUuidStack.tcpClientUuid,
        oldReleaseProtocol);
    }

    if (isORAddressUpdated || isORPortUpdated || isORProtocolUpdated) {
      ltpConfigurationList.push(preceedingApplicationClientUuidStack.tcpClientUuid);
    }

  }

  /****************************************************************************************
   * Prepare attributes to configure forwarding-construct
   * Since the following forwarding-constructs are invariant , no configuration required in the forwarding-construct
   * PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement,
   * PromptingNewReleaseForUpdatingServerCausesRequestForBroadcastingInfoAboutBackwardCompatibleUpdateOfOperation
   * PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease
   ****************************************************************************************/



  /****************************************************************************************
   * Prepare attributes to automate forwarding-construct
   ****************************************************************************************/
  let forwardingAutomationInputList = await prepareForwardingAutomation.embedYourself(
    ltpConfigurationList, oldApplicationNameInConfiguration
  );
  ForwardingAutomationService.automateForwardingConstructAsync(
    operationServerName,
    forwardingAutomationInputList,
    user,
    xCorrelator,
    traceIndicator,
    customerJourney
  );
}


/**
 * Stops sending notifications of a specific subscription
 *
 * body V1_endsubscription_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.endSubscription = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Returns administrative information
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_3
 **/
exports.informAboutApplication = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "application-name" : "OwnApplicationName",
  "release-number" : "1.0.0",
  "application-purpose" : "Brief description of the purpose of the application.",
  "data-update-period" : "real-time",
  "owner-name" : "Thorsten Heinze",
  "owner-email-address" : "Thorsten.Heinze@telefonica.com"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns administrative information for generic representation
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns genericRepresentation
 **/
exports.informAboutApplicationInGenericRepresentation = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "consequent-action-list" : [ {
    "request" : "request",
    "input-value-list" : [ {
      "field-name" : "field-name",
      "unit" : "unit"
    }, {
      "field-name" : "field-name",
      "unit" : "unit"
    } ],
    "display-in-new-browser-window" : true,
    "label" : "label"
  }, {
    "request" : "request",
    "input-value-list" : [ {
      "field-name" : "field-name",
      "unit" : "unit"
    }, {
      "field-name" : "field-name",
      "unit" : "unit"
    } ],
    "display-in-new-browser-window" : true,
    "label" : "label"
  } ],
  "response-value-list" : [ {
    "field-name" : "field-name",
    "datatype" : "datatype",
    "value" : "value"
  }, {
    "field-name" : "field-name",
    "datatype" : "datatype",
    "value" : "value"
  } ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns release history
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns List
 **/
exports.informAboutReleaseHistory = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "release-number" : "1.0.0",
  "release-date" : "20.11.2010",
  "changes" : "Initial version."
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns release history for generic representation
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns genericRepresentation
 **/
exports.informAboutReleaseHistoryInGenericRepresentation = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "consequent-action-list" : [ {
    "request" : "request",
    "input-value-list" : [ {
      "field-name" : "field-name",
      "unit" : "unit"
    }, {
      "field-name" : "field-name",
      "unit" : "unit"
    } ],
    "display-in-new-browser-window" : true,
    "label" : "label"
  }, {
    "request" : "request",
    "input-value-list" : [ {
      "field-name" : "field-name",
      "unit" : "unit"
    }, {
      "field-name" : "field-name",
      "unit" : "unit"
    } ],
    "display-in-new-browser-window" : true,
    "label" : "label"
  } ],
  "response-value-list" : [ {
    "field-name" : "field-name",
    "datatype" : "datatype",
    "value" : "value"
  }, {
    "field-name" : "field-name",
    "datatype" : "datatype",
    "value" : "value"
  } ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Receives information about where to ask for approval of OaM requests
 *
 * body V1_inquireoamrequestapprovals_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.inquireOamRequestApprovals = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Allows retrieving all interface and internal connection data
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_1
 **/
exports.listLtpsAndFcs = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "core-model-1-4:control-construct" : {
    "forwarding-domain" : [ {
      "uuid" : "ro-2-0-1-op-fd-000",
      "forwarding-construct" : [ {
        "uuid" : "ro-2-0-1-op-fc-bm-000",
        "name" : [ {
          "value-name" : "ForwardingKind",
          "value" : "core-model-1-4:FORWARDING_KIND_TYPE_INVARIANT_PROCESS_SNIPPET"
        }, {
          "value-name" : "ForwardingName",
          "value" : "PromptForRegisteringCausesRegistrationRequest"
        } ],
        "fc-port" : [ {
          "local-id" : "000",
          "port-direction" : "core-model-1-4:PORT_DIRECTION_TYPE_MANAGEMENT",
          "logical-termination-point" : "ro-2-0-1-op-s-bm-000"
        }, {
          "local-id" : "100",
          "port-direction" : "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
          "logical-termination-point" : "ro-2-0-1-op-s-bm-000"
        } ]
      }, {
        "uuid" : "ro-2-0-1-op-fc-bm-001",
        "name" : [ {
          "value-name" : "ForwardingKind",
          "value" : "core-model-1-4:FORWARDING_KIND_TYPE_INVARIANT_PROCESS_SNIPPET"
        }, {
          "value-name" : "ForwardingName",
          "value" : "PromptForEmbeddingCausesRequestForBequeathingData"
        } ],
        "fc-port" : [ {
          "local-id" : "100",
          "port-direction" : "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
          "logical-termination-point" : "ro-2-0-1-op-s-bm-001"
        }, {
          "local-id" : "200",
          "port-direction" : "core-model-1-4:PORT_DIRECTION_TYPE_OUTPUT",
          "logical-termination-point" : "ro-2-0-1-op-c-bm-ro-2-0-1-000"
        } ]
      } ]
    } ],
    "logical-termination-point" : [ {
      "uuid" : "ro-2-0-1-op-s-bm-000",
      "ltp-direction" : "core-model-1-4:TERMINATION_DIRECTION_SOURCE",
      "client-ltp" : [ ],
      "server-ltp" : [ "ro-2-0-1-http-s-000" ],
      "layer-protocol" : [ {
        "local-id" : "0",
        "layer-protocol-name" : "operation-server-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_OPERATION_LAYER",
        "operation-server-interface-1-0:operation-server-interface-pac" : {
          "operation-server-interface-capability" : {
            "operation-name" : "/v1/register-yourself"
          },
          "operation-server-interface-configuration" : {
            "life-cycle-state" : "operation-server-interface-1-0:LIFE_CYCLE_STATE_TYPE_EXPERIMENTAL"
          }
        }
      } ]
    }, {
      "uuid" : "ro-2-0-1-http-s-000",
      "ltp-direction" : "core-model-1-4:TERMINATION_DIRECTION_SOURCE",
      "client-ltp" : [ "ro-2-0-1-op-s-bm-000" ],
      "server-ltp" : [ ],
      "layer-protocol" : [ {
        "local-id" : "0",
        "layer-protocol-name" : "http-server-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_HTTP_LAYER",
        "http-server-interface-1-0:http-server-interface-pac" : {
          "http-server-interface-capability" : {
            "application-name" : "RegistryOffice",
            "release-number" : "2.0.1",
            "data-update-period" : "http-server-interface-1-0:DATA_UPDATE_PERIOD_TYPE_REAL_TIME"
          }
        }
      } ]
    } ],
    "uuid" : "uuid"
  }
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Offers configuring the client side for sending OaM request information
 *
 * body V1_redirectoamrequestinformation_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.redirectOamRequestInformation = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Offers configuring the client side for sending service request information
 *
 * body V1_redirectservicerequestinformation_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.redirectServiceRequestInformation = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Offers configuring client side for sending information about topology changes and provides current data tree
 *
 * body V1_redirecttopologychangeinformation_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_2
 **/
exports.redirectTopologyChangeInformation = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "core-model-1-4:control-construct" : {
    "forwarding-domain" : [ {
      "uuid" : "ro-2-0-1-op-fd-000",
      "forwarding-construct" : [ {
        "uuid" : "ro-2-0-1-op-fc-bm-000",
        "name" : [ {
          "value-name" : "ForwardingKind",
          "value" : "core-model-1-4:FORWARDING_KIND_TYPE_INVARIANT_PROCESS_SNIPPET"
        }, {
          "value-name" : "ForwardingName",
          "value" : "PromptForRegisteringCausesRegistrationRequest"
        } ],
        "fc-port" : [ {
          "local-id" : "000",
          "port-direction" : "core-model-1-4:PORT_DIRECTION_TYPE_MANAGEMENT",
          "logical-termination-point" : "ro-2-0-1-op-s-bm-000"
        }, {
          "local-id" : "100",
          "port-direction" : "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
          "logical-termination-point" : "ro-2-0-1-op-s-bm-000"
        } ]
      }, {
        "uuid" : "ro-2-0-1-op-fc-bm-001",
        "name" : [ {
          "value-name" : "ForwardingKind",
          "value" : "core-model-1-4:FORWARDING_KIND_TYPE_INVARIANT_PROCESS_SNIPPET"
        }, {
          "value-name" : "ForwardingName",
          "value" : "PromptForEmbeddingCausesRequestForBequeathingData"
        } ],
        "fc-port" : [ {
          "local-id" : "100",
          "port-direction" : "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
          "logical-termination-point" : "ro-2-0-1-op-s-bm-001"
        }, {
          "local-id" : "200",
          "port-direction" : "core-model-1-4:PORT_DIRECTION_TYPE_OUTPUT",
          "logical-termination-point" : "ro-2-0-1-op-c-bm-ro-2-0-1-000"
        } ]
      } ]
    } ],
    "logical-termination-point" : [ {
      "uuid" : "ro-2-0-1-op-s-bm-000",
      "ltp-direction" : "core-model-1-4:TERMINATION_DIRECTION_SOURCE",
      "client-ltp" : [ ],
      "server-ltp" : [ "ro-2-0-1-http-s-000" ],
      "layer-protocol" : [ {
        "local-id" : "0",
        "layer-protocol-name" : "operation-server-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_OPERATION_LAYER",
        "operation-server-interface-1-0:operation-server-interface-pac" : {
          "operation-server-interface-capability" : {
            "operation-name" : "/v1/register-yourself"
          },
          "operation-server-interface-configuration" : {
            "life-cycle-state" : "operation-server-interface-1-0:LIFE_CYCLE_STATE_TYPE_EXPERIMENTAL"
          }
        }
      } ]
    }, {
      "uuid" : "ro-2-0-1-http-s-000",
      "ltp-direction" : "core-model-1-4:TERMINATION_DIRECTION_SOURCE",
      "client-ltp" : [ "ro-2-0-1-op-s-bm-000" ],
      "server-ltp" : [ ],
      "layer-protocol" : [ {
        "local-id" : "0",
        "layer-protocol-name" : "http-server-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_HTTP_LAYER",
        "http-server-interface-1-0:http-server-interface-pac" : {
          "http-server-interface-capability" : {
            "application-name" : "RegistryOffice",
            "release-number" : "2.0.1",
            "data-update-period" : "http-server-interface-1-0:DATA_UPDATE_PERIOD_TYPE_REAL_TIME"
          }
        }
      } ]
    } ],
    "uuid" : "uuid"
  }
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Initiates registering at the currently active RegistryOffice
 * Shall also automatically execute without receiving any request every time the application starts
 *
 * body V1_registeryourself_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.registerYourself = async function (body, user, xCorrelator, traceIndicator, customerJourney, operationServerName, beaqueathYourDataAndDieForwardingName = undefined) {
  let ltpConfigurationList = [];
  let preceedingApplicationName;
  let preceedingApplicationRelease;

  if (Object.keys(body).length != 0) {
    /****************************************************************************************
     * Setting up required local variables from the request body
     ****************************************************************************************/

    let registryOfficeApplicationName = body["registry-office-application"];
    let registryOfficeReleaseNumber = body["registry-office-application-release-number"];
    let registryOfficeRegisterOperation = body["registration-operation"];
    let registryOfficeProtocol = body["registry-office-protocol"];
    let registryOfficeAddress = body["registry-office-address"];
    let registryOfficePort = body["registry-office-port"];

    // getting values for optional attributes 
    let httpAddress = body["http-address"];
    let httpPort = body["http-port"];

    preceedingApplicationName = body["preceding-application-name"];
    preceedingApplicationRelease = body["preceding-release-number"];

    /****************************************************************************************
     * Prepare logicalTerminationPointConfigurationInput object to
     * configure logical-termination-point
     ****************************************************************************************/
    // update the registryOffice configuration
    let registrationForwardingName = "PromptForRegisteringCausesRegistrationRequest";
    let registryOfficeClientUuidStack = await ServiceUtils.resolveClientUuidStackFromForwardingAsync(registrationForwardingName);

    let existingRegistryOfficeApplicationName = await httpClientInterface.getApplicationNameAsync(registryOfficeClientUuidStack.httpClientUuid);
    let existingRegistryOfficeReleaseNumber = await httpClientInterface.getReleaseNumberAsync(registryOfficeClientUuidStack.httpClientUuid);
    let existingRegistryOfficeAddress = await tcpClientInterface.getRemoteAddressAsync(registryOfficeClientUuidStack.tcpClientUuid);
    let existingRegistryOfficePort = await tcpClientInterface.getRemotePortAsync(registryOfficeClientUuidStack.tcpClientUuid);
    let existingRegistryOfficeProtocol = await tcpClientInterface.getRemoteProtocolAsync(registryOfficeClientUuidStack.tcpClientUuid);
    let exsitingRegistryOfficeRegisterOperation = await operationClientInterface.getOperationNameAsync(registryOfficeClientUuidStack.operationClientUuid);

    let isRoApplicationNameUpdated = false;
    let isRoReleaseNumberUpdated = false;
    let isRoAddressUpdated = false;
    let isRoPortUpdated = false;
    let isRoProtocolUpdated = false;
    let isRoRegisterOperationUpdated = false;

    if (registryOfficeApplicationName != existingRegistryOfficeApplicationName) {
      isRoApplicationNameUpdated = await httpClientInterface.setApplicationNameAsync(
        registryOfficeClientUuidStack.httpClientUuid,
        registryOfficeApplicationName);
    }
    if (registryOfficeReleaseNumber != existingRegistryOfficeReleaseNumber) {
      isRoReleaseNumberUpdated = await httpClientInterface.setReleaseNumberAsync(
        registryOfficeClientUuidStack.httpClientUuid,
        registryOfficeReleaseNumber);
    }
    if (JSON.stringify(registryOfficeAddress) != JSON.stringify(existingRegistryOfficeAddress)) {
      isRoAddressUpdated = await tcpClientInterface.setRemoteAddressAsync(
        registryOfficeClientUuidStack.tcpClientUuid,
        registryOfficeAddress);
    }
    if (registryOfficePort != existingRegistryOfficePort) {
      isRoPortUpdated = await tcpClientInterface.setRemotePortAsync(
        registryOfficeClientUuidStack.tcpClientUuid,
        registryOfficePort);
    }
    if (registryOfficeProtocol != existingRegistryOfficeProtocol) {
      isRoProtocolUpdated = await tcpClientInterface.setRemoteProtocolAsync(
        registryOfficeClientUuidStack.tcpClientUuid,
        registryOfficeProtocol);
    }
    if (registryOfficeRegisterOperation != exsitingRegistryOfficeRegisterOperation) {
      isRoRegisterOperationUpdated = await operationClientInterface.setOperationNameAsync(
        registryOfficeClientUuidStack.operationClientUuid,
        registryOfficeRegisterOperation);
    }

    if (isRoApplicationNameUpdated || isRoReleaseNumberUpdated) {
      ltpConfigurationList.push(registryOfficeClientUuidStack.httpClientUuid);
    }
    if (isRoAddressUpdated || isRoPortUpdated || isRoProtocolUpdated) {
      ltpConfigurationList.push(registryOfficeClientUuidStack.tcpClientUuid);
    }
    if (isRoRegisterOperationUpdated) {
      ltpConfigurationList.push(registryOfficeClientUuidStack.operationClientUuid);
    }

    // update tcp-server configuration if required
    let tcpServerWithHttpUpdated = await updateTcpServerDetails("HTTP", httpAddress, httpPort);
    if (tcpServerWithHttpUpdated.istcpServerUpdated) {
      ltpConfigurationList.push(tcpServerWithHttpUpdated.tcpServerUuid);
    }

    // update old release configuration
    let oldReleaseBeaqueathYourDataAndDieForwardingName
    if (beaqueathYourDataAndDieForwardingName == undefined) {
      oldReleaseBeaqueathYourDataAndDieForwardingName = "PromptForEmbeddingCausesRequestForBequeathingData";
    } else {
      oldReleaseBeaqueathYourDataAndDieForwardingName = beaqueathYourDataAndDieForwardingName
    }
    
    let preceedingApplicationClientUuidStack = await ServiceUtils.resolveClientUuidStackFromForwardingAsync(oldReleaseBeaqueathYourDataAndDieForwardingName);
    if(preceedingApplicationClientUuidStack){
    if (preceedingApplicationClientUuidStack.httpClientUuid) {
      let isPreceedingApplicationNameUpdated = false;
      let isPreceedingReleaseNumberUpdated = false;
      if (preceedingApplicationName != undefined) {
        let existingPreceedingApplicationName = await httpClientInterface.getApplicationNameAsync(
          preceedingApplicationClientUuidStack.httpClientUuid);
        if (existingPreceedingApplicationName != preceedingApplicationName) {
          isPreceedingApplicationNameUpdated = await httpClientInterface.setApplicationNameAsync(
            preceedingApplicationClientUuidStack.httpClientUuid,
            preceedingApplicationName);
        }
      }
      if (preceedingApplicationRelease != undefined) {
        let existingPreceedingApplicationReleaseNumber = await httpClientInterface.getReleaseNumberAsync(
          preceedingApplicationClientUuidStack.httpClientUuid);
        if (existingPreceedingApplicationReleaseNumber != preceedingApplicationRelease) {
          isPreceedingReleaseNumberUpdated = await httpClientInterface.setReleaseNumberAsync(
            preceedingApplicationClientUuidStack.httpClientUuid,
            preceedingApplicationRelease);
        }
      }
      if (isPreceedingApplicationNameUpdated || isPreceedingReleaseNumberUpdated) {
        ltpConfigurationList.push(preceedingApplicationClientUuidStack.httpClientUuid)
      }
    }
  }

    /****************************************************************************************
     * Prepare attributes to configure forwarding-construct
     * Since PromptForRegisteringCausesRegistrationRequest is invariant process snippet , 
     * no fc-port updation is required
     ****************************************************************************************/


  }

  /****************************************************************************************
   * Prepare attributes to automate forwarding-construct
   ****************************************************************************************/
  let forwardingAutomationToALTInputList = await prepareForwardingAutomation.updateLtpToALT(
    ltpConfigurationList
  );
  ForwardingAutomationService.automateForwardingConstructAsync(
    operationServerName,
    forwardingAutomationToALTInputList,
    user,
    xCorrelator,
    traceIndicator,
    customerJourney
  );

  let forwardingAutomationInputList = await prepareForwardingAutomation.registerYourself(
    preceedingApplicationName,
    preceedingApplicationRelease
  );
  automateRegisterApplicationAsync(
    forwardingAutomationInputList,
    user,
    xCorrelator,
    traceIndicator,
    customerJourney
  );
}


/**
 * Starts application in generic representation
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns genericRepresentation
 **/
exports.startApplicationInGenericRepresentation = function(user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "consequent-action-list" : [ {
    "request" : "request",
    "input-value-list" : [ {
      "field-name" : "field-name",
      "unit" : "unit"
    }, {
      "field-name" : "field-name",
      "unit" : "unit"
    } ],
    "display-in-new-browser-window" : true,
    "label" : "label"
  }, {
    "request" : "request",
    "input-value-list" : [ {
      "field-name" : "field-name",
      "unit" : "unit"
    }, {
      "field-name" : "field-name",
      "unit" : "unit"
    } ],
    "display-in-new-browser-window" : true,
    "label" : "label"
  } ],
  "response-value-list" : [ {
    "field-name" : "field-name",
    "datatype" : "datatype",
    "value" : "value"
  }, {
    "field-name" : "field-name",
    "datatype" : "datatype",
    "value" : "value"
  } ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Allows updating connection data of a serving application
 * 'Initiates update of release number and TCP/IP address at existing HttpClients and TcpClients. If combination of {future-application-name, future-release-number} is different from combination {current-application-name, current-release-number} and if HttpClient with combination of {future-application-name, future-release-number} already exists, HttpClient with combination {current-application-name, current-release-number} shall not be updated, but OperationClients shall be transferred to the HttpClient with combination of {future-application-name, future-release-number}.' 
 *
 * body V1_updateclient_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.updateClient = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Allows updating operation clients to redirect to backward compatible services
 *
 * body V1_updateoperationclient_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.updateOperationClient = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Allows updating operation key at a server or client
 *
 * body V1_updateoperationkey_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.updateOperationKey = function(body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

/**
 * @description This function helps to get the APISegment of the operationClient uuid
 * @return {Promise} returns the APISegment
 **/
async function updateTcpServerDetails(protocol, address, port) {
  let updatedDetails = {};
  let istcpServerUpdated = false;
  let tcpServerUuid;
  if (address != undefined || port != undefined) {
    tcpServerUuid = await tcpServerInterface.getUuidOfTheProtocol(protocol);
    if (tcpServerUuid != undefined && Object.keys(tcpServerUuid).length != 0) {
      if (address != undefined) {
        let localAddress = address;
        if (address[onfAttributes.TCP_CLIENT.IP_ADDRESS]) {
          localAddress = address[onfAttributes.TCP_CLIENT.IP_ADDRESS];
        }
        let configuredAddress = await tcpServerInterface.getLocalAddressOfTheProtocol(protocol);
        if (JSON.stringify(configuredAddress) != JSON.stringify(localAddress)) {
          istcpServerUpdated = await tcpServerInterface.setLocalAddressAsync(tcpServerUuid, localAddress);
        }
      }
      if (port != undefined) {
        let configuredPort = await tcpServerInterface.getLocalPortOfTheProtocol(protocol);
        if (configuredPort != port) {
          istcpServerUpdated = await tcpServerInterface.setLocalPortAsync(tcpServerUuid, port);
        }
      }
    }
  }
  updatedDetails.tcpServerUuid = tcpServerUuid;
  updatedDetails.istcpServerUpdated = istcpServerUpdated;
  return updatedDetails;
}

async function automateRegisterApplicationAsync(forwardingAutomationInputList, user,
  xCorrelator, traceIndicator, customerJourney) {
  let response;
  let traceIndicatorIncrementor = 1;
  for (let forwardingAutomationInput of forwardingAutomationInputList) {    
  let newTraceIndicator = traceIndicator + "." + traceIndicatorIncrementor++;
    if (!(response && response.status == 204)) {
      try {
        let forwardingName = forwardingAutomationInput.forwardingName;
        let attributeList = forwardingAutomationInput.attributeList;
        let forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(
          forwardingName);
        let fcPortList = forwardingConstruct["fc-port"];
        for (let fcPort of fcPortList) {
          let fcPortDirection = fcPort["port-direction"];
          if (fcPortDirection == FcPort.portDirectionEnum.OUTPUT) {
            let fcPortLogicalTerminationPoint = fcPort["logical-termination-point"];
            response = await eventDispatcher.dispatchEvent(
              fcPortLogicalTerminationPoint,
              attributeList,
              user,
              xCorrelator,
              newTraceIndicator,
              customerJourney,
              undefined,
              undefined,
              true
            );
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}

async function isForwardingNameExist(forwardingName) {
  const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  return forwardingConstruct !== undefined;
}