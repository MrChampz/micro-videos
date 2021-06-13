import { Dispatch, MutableRefObject, Reducer, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { MUIDataTableColumn } from "mui-datatables";
import { useDebounce } from "use-debounce";
import { useHistory, useLocation } from "react-router";
import { isEqual } from "lodash";
import * as yup from 'yup';

import reducer, { Creators } from "../store/filter";
import { State as FilterState, Actions as FilterActions } from "../store/filter/types";
import { MUIDataTableRefComponent } from "../components/DefaultTable";

interface UseFilterProps {
  columns: MUIDataTableColumn[];
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  debounceTime: number;
  tableRef: MutableRefObject<MUIDataTableRefComponent>;
  extraFilter?: ExtraFilter;
}

interface FilterManagerOptions extends Omit<UseFilterProps, 'debounceTime, rowsPerPageOptions, extraFilter'> {
  schema: yup.ObjectSchema<any>;
  state: FilterState;
  dispatch: Dispatch<FilterActions>;
}

interface ExtraFilter {
  getStateFromURL: (queryParams: URLSearchParams) => any;
  formatSearchParams: (debouncedState: FilterState) => any;
  createValidationSchema: () => any;
}

type FilterReducer = Reducer<FilterState, FilterActions>;

const useFilter = (options: UseFilterProps) => {
  const { rowsPerPageOptions, rowsPerPage, columns, extraFilter } = options;

  const history = useHistory();
  const {
    search: locationSearch,
    pathname: locationPathname,
    state: locationState
  } = useLocation();

  const schema = useMemo(() => {
    return yup.object().shape({
      search: yup
        .string()
        .transform(value => !value ? undefined : value)
        .default(''),
      pagination: yup.object().shape({
        page: yup
          .number()
          .transform(value => isNaN(value) || parseInt(value) < 1 ? undefined : value)
          .default(1),
        perPage: yup
          .number()
          .transform(value => {
            return isNaN(value) || !rowsPerPageOptions.includes(parseInt(value))
              ? undefined
              : value
          })
          .default(rowsPerPage),
      }),
      order: yup.object().shape({
        sort: yup
          .string()
          .nullable()
          .transform(value => {
            const columnsName = columns
              .filter(column => !column.options || column.options.sort !== false)
              .map(column => column.name);
            return columnsName.includes(value) ? value : undefined;
          })
          .default(null),
        dir: yup
          .string()
          .nullable()
          .transform(value => {
            return !value || !['asc', 'desc'].includes(value.toLowerCase())
              ? undefined
              : value
          })
          .default(null),
      }),
      ...(extraFilter && {
        extraFilter: extraFilter.createValidationSchema()
      })
    });
  }, [rowsPerPageOptions, rowsPerPage, columns, extraFilter]);
  
  const stateFromUrl = useMemo(() => {
    const params = locationSearch.substr(1);
    const queryParams = new URLSearchParams(params);
    return schema.cast({
      search: queryParams.get('search'),
      pagination: {
        page: queryParams.get('page'),
        perPage: queryParams.get('per_page'),
      },
      order: {
        sort: queryParams.get('sort'),
        dir: queryParams.get('dir'),
      },
      ...(extraFilter && {
        extraFilter: extraFilter.getStateFromURL(queryParams)
      })
    });
  }, [locationSearch, schema, extraFilter]);

  const [totalRecords, setTotalRecords] = useState(0);
  const [filterState, dispatch] = useReducer<FilterReducer>(reducer, stateFromUrl);
  const [debouncedFilterState] = useDebounce(filterState, options.debounceTime);

  const filterManager = new FilterManager({ ...options, schema, state: filterState, dispatch });
  filterManager.state = filterState;

  const cleanSearchText = useCallback((text) => {
    let newText = text;
    if (text && text.value !== undefined) {
      newText = text.value;
    }
    return newText;
  }, []);

  const formatSearchParams = useCallback((state, extraFilter) => {
    const search = cleanSearchText(state.search);
    return {
      ...(search && search !== '' && { search }),
      ...(state.pagination.page !== 1 && {
        page: state.pagination.page
      }),
      ...(state.pagination.perPage !== 15 && {
        per_page: state.pagination.perPage
      }),
      ...(state.order.sort && state.order),
      ...(extraFilter && extraFilter.formatSearchParams(state))
    };
  }, [cleanSearchText]);

  useEffect(() => {
    history.replace({
      pathname: locationPathname,
      search: "?" + new URLSearchParams(formatSearchParams(stateFromUrl, extraFilter)),
      state: stateFromUrl
    });
  }, [history, locationPathname, formatSearchParams, stateFromUrl, extraFilter]);

  useEffect(() => {
    const newLocation = {
      pathname: locationPathname,
      search: "?" + new URLSearchParams(formatSearchParams(debouncedFilterState, extraFilter)),
      state: {
        ...debouncedFilterState,
        search: cleanSearchText(debouncedFilterState.search)
      }
    };

    const currentState = locationState;
    const newState = debouncedFilterState;
    if (isEqual(currentState, newState)) return;

    history.push(newLocation);
  }, [
    history,
    locationPathname,
    locationState,
    formatSearchParams,
    debouncedFilterState,
    extraFilter,
    cleanSearchText
  ]);

  return {
    filterManager,
    filterState,
    debouncedFilterState,
    cleanSearchText,
    dispatch,
    totalRecords,
    setTotalRecords
  };
}

export class FilterManager {
  
  schema: any;
  state: FilterState;
  dispatch: Dispatch<FilterActions>;
  columns: MUIDataTableColumn[];
  rowsPerPage: number;
  tableRef: MutableRefObject<MUIDataTableRefComponent>;
  
  constructor(options: FilterManagerOptions) {
    const { schema, state, columns, dispatch, rowsPerPage, tableRef } = options;
    this.schema = schema;
    this.state = state;
    this.dispatch = dispatch;
    this.columns = columns;
    this.rowsPerPage = rowsPerPage;
    this.tableRef = tableRef;
  }

  changeSearch(search) {
    this.dispatch(Creators.setSearch({ search }));
  }

  changePage(page: number) {
    this.dispatch(Creators.setPage({ page: page + 1 }));
  }

  changeRowsPerPage(perPage: number) {
    this.dispatch(Creators.setPerPage({ perPage }));
  }

  changeColumnSort(changedColumn: string, dir: string) {
    this.dispatch(Creators.setOrder({ sort: changedColumn, dir }));
    this.resetTablePagination();
  }

  changeExtraFilter(data) {
    this.dispatch(Creators.updateExtraFilter(data));
  }

  resetFilter() {
    const initialState = {
      ...this.schema.cast({}),
      search: { value: null, update: true }
    };
    this.dispatch(Creators.setReset({ state: initialState }));
    this.resetTablePagination();
  }

  private resetTablePagination() {
    this.tableRef.current.changeRowsPerPage(this.rowsPerPage);
    this.tableRef.current.changePage(0);
  }
}

export default useFilter;