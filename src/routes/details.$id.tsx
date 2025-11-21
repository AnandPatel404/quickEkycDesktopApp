import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import useUserStore, {
	type UserStateInterface,
	type Settings,
} from "@/store/dashboard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type CSVRow = Record<string, string>;

interface UploadSuccessResponse {
	status: string;
	message?: string;
	[key: string]: unknown;
}

interface UploadErrorResponse {
	row: CSVRow;
	error: unknown;
}

type UploadBody = Record<string, string>;


function SecondPage() {
	const { id } = Route.useParams();
	const [itemData, setItemData] = useState<Settings>({
		id: 0,
		name: "",
		desc: "",
		url: "",
		inputs: [],
	});

	const [progress, setProgress] = useState(0);
	const [loading, setLoading] = useState(false);
	const [apiToken, setApiToken] = useState("");
	const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
	const [manualValues, setManualValues] = useState<Record<string, string>>(
		{},
	);
	const [manualLoading, setManualLoading] = useState(false);
	const [manualResult, setManualResult] = useState<unknown>(null);
	const [successResults, setSuccessResults] = useState<
		UploadSuccessResponse[]
	>([]);
	const [errorResults, setErrorResults] = useState<UploadErrorResponse[]>([]);

	const data = useUserStore((state) => (state as UserStateInterface).data);

	// READ CSV — only store rows now
	const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		setSuccessResults([]);
		setErrorResults([]);
		setProgress(0);

		const file = e.target.files?.[0];
		if (!file) return;

		const text = await file.text();
		const rows = text
			.split("\n")
			.map((r) => r.trim())
			.filter(Boolean);
		const headers = rows[0].split(",");

		const parsedRows: CSVRow[] = rows.slice(1).map((row) => {
			const values = row.split(",");
			const obj: CSVRow = {};

			headers.forEach((h, i) => {
				obj[h.trim()] = values[i]?.trim() || "";
			});

			return obj;
		});

		setCsvRows(parsedRows);
	};

	// FINAL SUBMIT: Upload each row manually
	const uploadRows = async (rows: CSVRow[]) => {
		if (apiToken.trim() === "" || apiToken.trim() === null) {
			alert("Please enter a valid API token.");
			return;
		}

		const total = rows.length;
		let uploaded = 0;

		setSuccessResults([]);
		setErrorResults([]);
		setProgress(0);

		setLoading(true);

		for (const row of rows) {
			const body: UploadBody = {
				key: apiToken,
			};
			itemData.inputs.forEach((input) => {
				body[input.key] = row[input.name] || "";
			});

			if (itemData.url) {
				try {
					const response = await fetch(itemData.url, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(body),
					});

					const json =
						(await response.json()) as UploadSuccessResponse;

					if (response.ok && json.success === true) {
						setSuccessResults((prev) => [...prev, json]);
					} else {
						setErrorResults((prev) => [
							...prev,
							{ row, error: json },
						]);
					}
				} catch (err) {
					setErrorResults((prev) => [
						...prev,
						{
							row,
							error: err instanceof Error ? err.message : err,
						},
					]);
				}

				uploaded++;
				setProgress(Math.round((uploaded / total) * 100));
			}
		}
		setLoading(false);
	};

	// RESET BUTTON
	const handleReset = () => {
		setCsvRows([]);
		setSuccessResults([]);
		setErrorResults([]);
		setProgress(0);
	};

	const downloadCombinedCSV = () => {
		if (successResults.length === 0 && errorResults.length === 0) {
			alert("No results to download.");
			return;
		}

		const combinedFlatRows: Array<{
			[key: string]: string | number | boolean | null;
			status_code: string | number;
			success: boolean;
			message: string;
			message_code: string;
			type: "success" | "error";
			error_message: string;
		}> = [];

		// --- Process SUCCESS rows ---
		successResults.forEach((resp) => {
			const data = resp.data || {};

			combinedFlatRows.push({
				...data,
				status_code: resp.status_code as string | number,
				success: Boolean(resp.success),
				message: resp.message ?? "",
				message_code: String(resp.message_code ?? ""),
				type: "success",
				error_message: "",
			});
		});

		// --- Process ERROR rows ---
		errorResults.forEach((err) => {
			const apiError = err.error
			combinedFlatRows.push({
				...err.row, // original CSV row input
				status_code: (apiError as { status_code?: string | number }).status_code ?? "",
				success: (apiError as { success?: boolean }).success ?? false,
				message: (apiError as { message?: string }).message ?? "",
				message_code: (apiError as { message_code?: string }).message_code ?? "",
				type: "error",
				error_message:
					typeof err.error === "string"
						? err.error
						: JSON.stringify(err.error),
			});
		});

		// Collect ALL possible keys
		const allKeys = new Set<string>();
		combinedFlatRows.forEach((row) => {
			Object.keys(row).forEach((k) => allKeys.add(k));
		});

		const headers = Array.from(allKeys);

		// Build CSV
		const csvRows = [headers.join(",")];

		combinedFlatRows.forEach((row) => {
			const r = headers
				.map((h) => JSON.stringify(row[h] ?? ""))
				.join(",");
			csvRows.push(r);
		});

		// Download
		const csvString = csvRows.join("\n");
		const blob = new Blob([csvString], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = "combined_results.csv";
		a.click();

		window.URL.revokeObjectURL(url);
	};

	const handleManualSubmit = async () => {
		if (!apiToken) {
			alert("Please enter API token.");
			return;
		}

		setManualLoading(true);
		setManualResult(null);

		const body = {
			key: apiToken,
			...manualValues,
		};

		try {
			const response = await fetch(itemData.url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const json = await response.json();
			setManualResult(json);
			console.log(manualResult);
		} catch (err) {
			setManualResult(err instanceof Error ? err.message : err);
		}

		setManualLoading(false);
	};

	const downloadSampleCsv = () => {
		if (!itemData || !itemData.inputs) return;

		// CSV headers = input names (because CSV parser maps using input.name)
		const headers = itemData.inputs.map((inp) => inp.name);

		// Create an empty sample row
		const sampleRow = headers.map(() => "");

		const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `${itemData.name || "sample"}_sample.csv`;
		a.click();

		window.URL.revokeObjectURL(url);
	};


	useEffect(() => {
		const item = data.find((d) => d.id === Number(id));
		if (item) {
			setTimeout(() => setItemData(item), 0);
			// initialize manual input fields
			setManualValues(() => {
				const initial: Record<string, string> = {};
				item.inputs.forEach((inp) => (initial[inp.key] = ""));
				return initial;
			});
		}
	}, [id, data]);

	return (
		<div className="p-4">
			<div className=" ">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<Card>
						<CardHeader>
							<CardTitle>
								<h1 className="text-2xl font-bold">
									{itemData.name}
								</h1>
							</CardTitle>
							<CardDescription>{itemData.desc}</CardDescription>
						</CardHeader>
					</Card>

					<Card>
						<CardContent>
							<h2 className="mb-2 text-xl font-bold">
								Basic info and api token:
							</h2>

							<div className="flex flex-col gap-6">
								<div className="grid gap-2">
									<Label htmlFor="email">URL</Label>
									<Input
										id="url"
										type="text"
										value={itemData.url}
										readOnly
										disabled
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="email">API TOKEN</Label>
									<Input
										id="token"
										type="text"
										required
										value={apiToken}
										onChange={(e) =>
											setApiToken(e.target.value)
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-2"></div>
						</CardContent>
					</Card>

					<Card>
						<CardContent>
							<h2 className="mb-2 text-xl font-bold">
								Manuel Test
							</h2>
							<div className="flex flex-col gap-3">
								{itemData.inputs.map((input, index) => (
									<div key={index} className="grid gap-1">
										<Label>{input.name}</Label>
										<Input
											type="text"
											value={
												manualValues[input.key] ?? ""
											}
											onChange={(e) =>
												setManualValues((prev) => ({
													...prev,
													[input.key]: e.target.value,
												}))
											}
											required
										/>
									</div>
								))}

								<Button
									onClick={handleManualSubmit}
									disabled={manualLoading}
									variant="default"
									className="w-fit"
								>
									{manualLoading ? (
										<>
											<Spinner className="mr-2 h-4 w-4" />
											Sending...
										</>
									) : (
										"Send Test Request"
									)}
								</Button>

								<pre className="bg-muted mt-3 max-h-[500px] overflow-x-auto rounded border p-2 text-sm">
									{JSON.stringify(manualResult, null, 2)}
								</pre>
							</div>

							<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-2"></div>
						</CardContent>
					</Card>

					<Card>
						<CardContent>
							<h2 className="mb-2 text-xl font-bold">
								Upload CSV File:
							</h2>

							<input
								type="file"
								accept=".csv"
								onChange={handleCSVUpload}
								className="border-border bg-popover w-full rounded-md border p-4"
							/>

							{csvRows.length > 0 && (
								<p className="text-muted-foreground text-sm">
									{csvRows.length} rows ready to submit
								</p>
							)}

							<div className="mt-3 mb-3 flex gap-3">
								<Button
									onClick={() => uploadRows(csvRows)}
									disabled={
										csvRows.length === 0 || loading === true
									}
									variant="default"
								>
									{loading ? (
										<>
											<Spinner className="mr-2 h-4 w-4" />
											Uploading...
										</>
									) : (
										"Submit"
									)}
								</Button>

								<Button
									onClick={handleReset}
									variant="secondary"
									disabled={loading === true}
								>
									Reset
								</Button>
								<Button
									onClick={downloadCombinedCSV}
									variant="outline"
									disabled={
										(successResults.length === 0 &&
											errorResults.length === 0) ||
										loading === true
									}
								>
									Download Results CSV
								</Button>
								<Button
									onClick={downloadSampleCsv}
									variant="outline"
								>
									Download Sample CSV
								</Button>
							</div>
							<Progress value={progress} className="w-[100%]" />
						</CardContent>
					</Card>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{/* SUCCESS RESPONSE CARD */}
						<div className="h-[500px] overflow-x-auto rounded-lg border border-green-500 bg-green-50 p-4">
							<h2 className="mb-2 text-xl font-semibold text-green-700">
								Success Results
							</h2>
							{successResults.length === 0 ? (
								<p className="text-sm text-green-700">
									No success results yet
								</p>
							) : (
								successResults.map((s, i) => (
									<pre
										key={i}
										className="mb-2 rounded border p-2 text-sm"
									>
										{JSON.stringify(s, null, 2)}
									</pre>
								))
							)}
						</div>

						{/* ERROR RESPONSE CARD */}
						<div className="h-[500px] overflow-x-auto rounded-lg border border-red-500 bg-red-50 p-4">
							<h2 className="mb-2 text-xl font-semibold text-red-700">
								Error Results
							</h2>
							{errorResults.length === 0 ? (
								<p className="text-sm text-red-700">
									No errors yet
								</p>
							) : (
								errorResults.map((err, i) => (
									<pre
										key={i}
										className="mb-2 rounded border p-2 text-sm"
									>
										Row: {JSON.stringify(err.row, null, 2)}
										{"\n\n"}
										Error:{" "}
										{JSON.stringify(err.error, null, 2)}
									</pre>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/details/$id")({
	component: SecondPage,
});
