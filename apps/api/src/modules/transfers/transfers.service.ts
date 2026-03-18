import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { TransfersQuery, TransferContract } from "./transfers.contracts.js";
import { toTransferContract } from "./transfers.mapper.js";
import { findTransfers, findTransferById } from "./transfers.repository.js";

export async function listTransfers(
  query: TransfersQuery,
): Promise<PaginatedResponse<TransferContract>> {
  const { transfers, totalItems } = await findTransfers(query);
  return {
    data: transfers.map(toTransferContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getTransfer(
  id: number,
): Promise<DetailResponse<TransferContract>> {
  const transfer = await findTransferById(id);
  if (!transfer) throw new NotFoundError("Transfer");
  return { data: toTransferContract(transfer) };
}
