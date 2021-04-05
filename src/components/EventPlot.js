import React, { Component } from "react";
import Plot from 'react-plotly.js';
import './EventPlot.css'
import Button from "react-bootstrap/Button";

class EventPlot extends Component {
    state = {
        input: "",
        submitted: false,
        errorInput: false,
        plotData: []
    }

    handleGeneratePlot = (event) => {
        this.setState({
            errorInput: false,
            submitted: true
        });
        this.proccessEventData();
        event.preventDefault();
    }

    handleEventTextArea = (event) => {
        this.setState({input: event.target.value})
    }

    proccessEventData() {
        const inputLines = this.state.input.split("\n");

        //this variables are used to control which event to expect
        let readStart = false;
        let readStop = false;

        //this variables are used to store the select and group expected
        let selectList = [];
        let groupList = [];

        //this dict is used to store every data to plot
        let dataDict = {};

        //this variables store the span of the events
        let minSpan = -1;
        let maxSpan = -1;

        //this counter is used to prevent the plot of having too many events
        let eventsNumber = 0;

        //this loop will read every line one by one
        for (let i = 0; i < inputLines.length; i++) {
            //ignoring blank lines
            if(inputLines[i] === "")
                continue;

            //Parsing every line as a JSON, unfortunately i had trouble reading non-JSON inputs. So the input needs to be JSON
            const line = JSON.parse(inputLines[i]);
            eventsNumber += 1;

            //If there's more than 50 events, the application will ignore the input
            if(eventsNumber > 50) {
                return;
            }

            if(!readStart && !readStop) {
                //this state is looking for a START event
                if(line["type"] === "start") {
                    selectList = line["select"];
                    groupList = line["group"];
                    readStart = true;

                    //resetting those variables so that it's generated a brand new plot, in case we have two of each START and END events.
                    //That way only the last START/END event is read.
                    dataDict = {};
                    minSpan = -1;
                    maxSpan = -1;
                }
            } else if (readStart && !readStop) {
                //this state is looking for SPAN or DATA or STOP events

                if (line["type"] === "data") {
                    //ignore data if it isn't between timestamp determined
                    if (line["timestamp"] > maxSpan || line["timestamp"] < minSpan) {
                        continue;
                    }

                    //Look for group in the JSON
                    let groups = [];
                    for (let j = 0; j < groupList.length; j++) {
                        if(line[groupList[j]] !== undefined) {
                            groups.push(line[groupList[j]]);
                        }
                    }

                    let seriesName = groups.join(" ");

                    //Now looking for select in the JSOn
                    for (let j = 0; j < selectList.length; j++) {
                        if(line[selectList[j]] !== undefined) {
                            let name = seriesName + " " +selectList[j];
                            let yData = line[selectList[j]];
                            let xData = new Date(line["timestamp"]);

                            //Adding the data from de JSON to the dataDict
                            if(name in dataDict) {
                                dataDict[name]["x"].push(xData);
                                dataDict[name]["y"].push(yData);
                            } else {
                                dataDict[name] = {
                                    x: [xData],
                                    y: [yData],
                                    name: name,
                                    mode: "lines+markers"
                                };
                            }
                        }
                    }

                } else if (line["type"] === "span") {
                    //Reading the span of the events
                    minSpan = line["begin"];
                    maxSpan = line["end"];
                } else if (line["type"] === "stop") {
                    //this state will reset the readStart and readStop, so it can start looking for another START event
                    readStart = false;
                    readStop = false;
                }
            }
        }
        let plotData = [];
        for (var key in dataDict){
            plotData.push(dataDict[key]);
        }

        this.setState({plotData: plotData});
    }

    //i decided to use plotply to show the plot of events because it's a really simple and easy to use lib to make some nice graphs.
    render() {
        return(
            <div>
                <form className="form-horizontal" onSubmit={this.handleGeneratePlot}>
                    <textarea id="eventTextArea" className="EventInputTextArea" onChange={this.handleEventTextArea}/>
                    <Plot
                        className="Plot"
                        data={this.state.plotData}
                        layout={ {autosize: true} }
                    />
                    <div className="footerStyle">
                        <Button
                            className="btn btn-primary eventButtonStyle"
                            type="submit"
                        >Generate Plot</Button>
                    </div>
                </form>
            </div>
        );
    }
}

export default EventPlot