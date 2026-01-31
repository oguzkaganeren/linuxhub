import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, X, Loader, RefreshCw } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence } from "framer-motion";

import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  bluetoothDeviceDiscovered,
  bluetoothDeviceRemoved,
} from "../../store/appSlice";
import { translations } from "../../data/translations";
import { BluetoothDevice, BluetoothDeviceEvent } from "../../types";
import * as bluetooth from "../../lib/bluetooth";
import * as printer from "../../lib/printer";
import AddPrinterModal from "../../components/configuration/AddPrinterModal";

const DevicesPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { language, bluetoothDevices, printers } = useAppSelector(
    (state) => state.app
  );

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isAddPrinterModalOpen, setAddPrinterModalOpen] = useState(false);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let translation =
        translations[language]?.[key] || translations["en"]?.[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          translation = translation.replace(`{${paramKey}}`, String(value));
        });
      }
      return translation;
    },
    [language]
  );

  useEffect(() => {
    let unlistenBluetooth: (() => void) | undefined;
    let unlistenPrinters: (() => void) | undefined;

    const setupListeners = async () => {
      // Bluetooth
      unlistenBluetooth = await listen<BluetoothDeviceEvent>(
        "bluetooth-device-update",
        (event) => {
          const update = event.payload;
          if (update.type === "discovered") {
            dispatch(bluetoothDeviceDiscovered(update.device));
          } else if (update.type === "removed") {
            dispatch(bluetoothDeviceRemoved(update.address));
          }
        }
      );
      try {
        const devices = await bluetooth.listPairedDevices();
        devices.forEach((device) =>
          dispatch(bluetoothDeviceDiscovered(device))
        );
      } catch (error) {
        toast.error(`Failed to load paired devices: ${error}`);
      }

      // Printers
      unlistenPrinters = await printer.initPrinterListener(dispatch);
      printer.getPrinters(); // Fetch initial list
    };

    setupListeners();

    return () => {
      if (unlistenBluetooth) unlistenBluetooth();
      if (unlistenPrinters) unlistenPrinters();
    };
  }, [dispatch]);

  // --- Bluetooth Logic ---
  const handleStartDiscovery = async () => {
    setIsDiscovering(true);
    toast(t("toast_searching_devices"));
    try {
      await bluetooth.startDiscovery();
      setTimeout(() => setIsDiscovering(false), 20000);
    } catch (error) {
      toast.error(String(error));
      setIsDiscovering(false);
    }
  };

  const createDeviceActionHandler = (
    action: (address: string) => Promise<any>,
    successMsg: string,
    errorMsg: string
  ) => {
    return async (device: BluetoothDevice) => {
      setPendingAction(device.address);
      try {
        await action(device.address);
        toast.success(`${device.name || device.address}: ${successMsg}`);
      } catch (error) {
        toast.error(`${device.name || device.address}: ${errorMsg}. ${error}`);
      } finally {
        setPendingAction(null);
      }
    };
  };

  const handleConnect = createDeviceActionHandler(
    bluetooth.connectDevice,
    "Connected",
    "Connection failed"
  );
  const handleDisconnect = createDeviceActionHandler(
    bluetooth.disconnectDevice,
    "Disconnected",
    "Disconnect failed"
  );
  const handlePair = createDeviceActionHandler(
    bluetooth.pairDevice,
    "Pairing successful",
    "Pairing failed"
  );
  const handleRemove = async (device: BluetoothDevice) => {
    setPendingAction(device.address);
    try {
      await bluetooth.removeDevice(device.address);
      dispatch(bluetoothDeviceRemoved(device.address));
      toast.success(`${device.name || device.address}: Removed`);
    } catch (error) {
      toast.error(
        `${device.name || device.address}: Failed to remove. ${error}`
      );
    } finally {
      setPendingAction(null);
    }
  };

  // --- Printer Logic ---
  const handleRemovePrinter = async (name: string) => {
    const confirmText = t("remove_printer_confirm_text", { printerName: name });
    if (window.confirm(confirmText)) {
      try {
        await printer.removePrinterCmd(name);
      } catch (e) {
        toast.error(`Failed to remove printer: ${e}`);
      }
    }
  };

  const getStatusChip = (status: string) => {
    const s = status.toLowerCase();
    let colorClasses =
      "bg-gray-200 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300";
    if (s.includes("idle")) {
      colorClasses =
        "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300";
    } else if (s.includes("stopped") || s.includes("offline")) {
      colorClasses =
        "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300";
    } else if (s.includes("processing") || s.includes("printing")) {
      colorClasses =
        "bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300";
    }
    return (
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClasses}`}
      >
        {status}
      </span>
    );
  };

  const renderBluetoothDeviceActions = (device: BluetoothDevice) => {
    if (pendingAction === device.address) {
      return <Loader size={20} className="animate-spin text-gray-500" />;
    }
    return (
      <div className="flex items-center gap-2">
        {!device.paired && (
          <button
            onClick={() => handlePair(device)}
            className="px-3 py-1 text-sm bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
          >
            Pair
          </button>
        )}
        {device.paired && !device.connected && (
          <button
            onClick={() => handleConnect(device)}
            className="px-3 py-1 text-sm bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors"
          >
            Connect
          </button>
        )}
        {device.connected && (
          <button
            onClick={() => handleDisconnect(device)}
            className="px-3 py-1 text-sm bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-600 transition-colors"
          >
            Disconnect
          </button>
        )}
        {device.paired && (
          <button
            onClick={() => handleRemove(device)}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  };

  return (
    <Panel title={t("device_management")}>
      {/* Bluetooth Devices */}
      <BlurredCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t("bluetooth_devices")}</h2>
          <button
            onClick={handleStartDiscovery}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:brightness-90 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {isDiscovering ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {isDiscovering ? "Scanning..." : "Scan for Devices"}
          </button>
        </div>
        <div className="space-y-2">
          {bluetoothDevices.map((device) => (
            <div
              key={device.address}
              className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <AppIcon
                  name="bluetooth"
                  className="w-5 h-5 text-gray-600 dark:text-gray-300 flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="font-medium truncate">
                    {device.name || "Unknown Device"}
                  </p>
                  <p className="text-xs font-mono text-gray-500">
                    {device.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {device.connected && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    Connected
                  </span>
                )}
                {device.paired && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    Paired
                  </span>
                )}
                {renderBluetoothDeviceActions(device)}
              </div>
            </div>
          ))}
          {bluetoothDevices.length === 0 && !isDiscovering && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No Bluetooth devices found. Try scanning.
            </div>
          )}
        </div>
      </BlurredCard>

      {/* Printers */}
      <BlurredCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t("printers")}</h2>
          <button
            onClick={() => setAddPrinterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:brightness-90 transition-all"
          >
            <Plus size={16} /> {t("add_printer")}
          </button>
        </div>
        <div className="space-y-2">
          {printers.map((printer) => (
            <div
              key={printer.name}
              className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <AppIcon
                  name="printer"
                  className="w-5 h-5 text-gray-600 dark:text-gray-300 flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="font-medium truncate" title={printer.name}>
                    {printer.name}{" "}
                    {printer.isDefault && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (Default)
                      </span>
                    )}
                  </p>
                  <p
                    className="text-xs text-gray-500 dark:text-gray-400 truncate"
                    title={printer.description}
                  >
                    {printer.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {getStatusChip(printer.state)}
                <button
                  onClick={() => handleRemovePrinter(printer.name)}
                  className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
          {printers.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No printers found.
            </div>
          )}
        </div>
      </BlurredCard>
      <AnimatePresence>
        {isAddPrinterModalOpen && (
          <AddPrinterModal onClose={() => setAddPrinterModalOpen(false)} />
        )}
      </AnimatePresence>
    </Panel>
  );
};

export default DevicesPanel;
