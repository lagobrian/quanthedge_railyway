"use client"; // Ensure this is at the top

import React, { useState, useEffect } from 'react';
import protobuf from 'protobufjs';
import WebSocket from 'isomorphic-ws';

interface TickerInfo {
    price: string;
    changePercent: string;
}

interface TickerData {
    [key: string]: TickerInfo;
}

const TickerTape: React.FC = () => {
    const [tickerData, setTickerData] = useState<TickerData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const tickers: string[] = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META'];

    useEffect(() => {
        let ws: WebSocket;
        let Yaticker: protobuf.Type;

        const loadProtoAndConnect = async () => {
            try {
                const root = await protobuf.load('./YPricingData.proto');
                Yaticker = root.lookupType('yaticker');
                connectWebSocket();
            } catch (err) {
                console.error('Failed to load protobuf file:', err);
                setError('Failed to load protobuf file.');
            }
        };

        const connectWebSocket = () => {
            ws = new WebSocket('wss://streamer.finance.yahoo.com');

            ws.onopen = () => {
                console.log('Connected to Yahoo Finance WebSocket');
                ws.send(JSON.stringify({ subscribe: tickers }));
            };

            ws.onmessage = (message: WebSocket.MessageEvent) => {
                try {
                    const buffer = Buffer.from(message.data as ArrayBuffer);
                    const decoded = Yaticker.decode(buffer);
                    const ticker = decoded.id;
                    const price = decoded.price?.toFixed(2) ?? '0.00';
                    const changePercent = decoded.changePercent?.toFixed(2) ?? '0.00';

                    setTickerData((prevData) => ({
                        ...prevData,
                        [ticker]: { price, changePercent },
                    }));

                    setIsLoading(false);
                } catch (err) {
                    console.error('Error decoding WebSocket message:', err);
                    setError('Failed to decode WebSocket data.');
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                setError('WebSocket connection error.');
            };

            ws.onclose = () => {
                console.log('Disconnected from WebSocket. Attempting to reconnect...');
                setError('Disconnected from WebSocket. Reconnecting...');
                setTimeout(connectWebSocket, 5000);
            };
        };

        loadProtoAndConnect();

        return () => {
            ws?.close();
        };
    }, []);

    if (isLoading) {
        return <div className="w-full py-2.5 text-center text-muted-foreground">Loading market data...</div>;
    }

    if (error) {
        return <div className="w-full py-2.5 text-center text-red-600">{error}</div>;
    }

    return (
        <div className="w-full overflow-hidden bg-muted/20 whitespace-nowrap py-2.5">
            <div className="inline-block animate-ticker hover:[animation-play-state:paused]">
                {Object.entries(tickerData).map(([ticker, data]) => (
                    <span key={ticker} className="mr-8 font-mono text-base">
                        {ticker}: ${data.price} (
                        <span className={Number(data.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Number(data.changePercent) >= 0 ? '+' : ''}
                            {data.changePercent}%
                        </span>)
                    </span>
                ))}
                {Object.entries(tickerData).map(([ticker, data]) => (
                    <span key={`${ticker}-duplicate`} className="mr-8 font-mono text-base">
                        {ticker}: ${data.price} (
                        <span className={Number(data.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Number(data.changePercent) >= 0 ? '+' : ''}
                            {data.changePercent}%
                        </span>)
                    </span>
                ))}
            </div>
        </div>
    );
};

export default TickerTape;