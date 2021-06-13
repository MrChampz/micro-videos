import React, { MutableRefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton, MuiThemeProvider } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useSnackbar } from 'notistack';
import { invert } from 'lodash';
import * as yup from 'yup';
import { DefaultTable, TableColumn } from '../../components';
import { makeActionStyles } from '../../components/DefaultTable/styles';
import { CastMember, CastMemberTypeMap, ListResponse } from '../../util/models';
import CastMemberResource from '../../util/http/cast-member-resource';
import { MUIDataTableRefComponent } from '../../components/DefaultTable';
import useFilter from '../../hooks/useFilter';
import FilterResetButton from '../../components/DefaultTable/FilterResetButton';
import LoadingContext from '../../components/LoadingProvider/LoadingContext';

const castMemberTypeNames = Object.values(CastMemberTypeMap);

const columns: TableColumn[] = [
  {
    name: "id",
    label: "ID",
    options: {
      sort: false,
      filter: false,
    },
    width: "30%",
  },
  {
    name: "name",
    label: "Nome",
    options: {
      filter: false,
    },
    width: "32%",
  },
  {
    name: "type",
    label: "Tipo",
    options: {
      filterOptions: {
        names: castMemberTypeNames
      },
      customBodyRender: (value, tableMeta, updateValue) => {
        return CastMemberTypeMap[value];
      }
    },
    width: "15%",
  },
  {
    name: "created_at",
    label: "Criado em",
    options: {
      filter: false,
      customBodyRender: (value, tableMeta, updateValue) => {
        return <span>{ format(parseISO(value), 'dd/MM/yyyy') }</span>
      }
    },
    width: "10%",
  },
  {
    name: "actions",
    label: "Ações",
    options: {
      sort: false,
      filter: false,
      customBodyRender: (value, tableMeta) => {
        return (
          <IconButton
            color="secondary"
            component={ Link }
            to={ `/cast_members/${ tableMeta.rowData[0] }/edit` }
          >
            <EditIcon />
          </IconButton>
        )
      }
    },
    width: "13%",
  },
];

const debounceTime = 300;
const debouncedSearchTime = 300;
const rowsPerPage = 15;
const rowsPerPageOptions = [15, 25, 50];

const Table: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const subscribed = useRef(true);
  const tableRef = useRef() as MutableRefObject<MUIDataTableRefComponent>;

  const loading = useContext(LoadingContext);
  const [data, setData] = useState<CastMember[]>([]);

  const extraFilter = useMemo(() => ({
    createValidationSchema: () => {
      return yup.object().shape({
        type: yup
          .string()
          .nullable()
          .oneOf(castMemberTypeNames)
          .transform(value => {
            return !value || !castMemberTypeNames.includes(value) ? undefined : value;
          })
          .default(null),
      });
    },
    formatSearchParams: (debouncedState) => {
      return debouncedState.extraFilter ? {
        ...(debouncedState.extraFilter && debouncedState.extraFilter.type && {
          type: debouncedState.extraFilter.type
        }),
      } : undefined;
    },
    getStateFromURL: (queryParams) => {
      return {
        type: queryParams.get('type'),
      }
    },
  }), []);

  const {
    filterManager,
    filterState,
    debouncedFilterState,
    cleanSearchText,
    totalRecords,
    setTotalRecords
  } = useFilter({
    columns,
    debounceTime,
    rowsPerPage,
    rowsPerPageOptions,
    tableRef,
    extraFilter
  });

  const searchText = cleanSearchText(debouncedFilterState.search);

  const getData = useCallback(async ({ search, page, perPage, sort, dir, type }) => {
    try {
      const { data } = await CastMemberResource.list<ListResponse<CastMember>>({
        queryParams: {
          search: search,
          page: page,
          per_page: perPage,
          sort: sort,
          dir: dir,
          ...(type && { type: invert(CastMemberTypeMap)[type] })
        }
      });
      if (subscribed.current) {
        setData(data.data);
        setTotalRecords(data.meta.total);
      }
    } catch(error) {
      console.error(error);
      if (CastMemberResource.isCancelledRequest(error)) return;
      enqueueSnackbar("Não foi possível carregar as informações", { variant: 'error' });
    }
  }, [enqueueSnackbar, setTotalRecords]);

  useEffect(() => {
    subscribed.current = true;
    getData({
      search: searchText,
      page: debouncedFilterState.pagination.page,
      perPage: debouncedFilterState.pagination.perPage,
      sort: debouncedFilterState.order.sort,
      dir: debouncedFilterState.order.dir,
      type: debouncedFilterState?.extraFilter?.type
    });
    return () => { subscribed.current = false; };
  }, [
    getData,
    searchText,
    debouncedFilterState.pagination,
    debouncedFilterState.order,
    debouncedFilterState.extraFilter
  ]);

  if (debouncedFilterState.extraFilter) {
    const column = columns.find(column => column.name === 'type');
    if (column && column.options) {
      const typeFilter = debouncedFilterState.extraFilter.type;
      column.options.filterList = typeFilter ? [typeFilter] : [];
    }
  }

  return (
    <MuiThemeProvider theme={ makeActionStyles(columns.length - 1) }>
      <DefaultTable
        title=""
        ref={ tableRef }
        columns={ columns }
        data={ data }
        loading={ loading }
        debouncedSearchTime={ debouncedSearchTime }
        options={{
          serverSide: true,
          searchText: filterState.search as any,
          page: filterState.pagination.page - 1,
          rowsPerPage: filterState.pagination.perPage,
          rowsPerPageOptions,
          count: totalRecords,
          sortOrder: {
            name: filterState.order.sort || "none",
            direction: (filterState.order.dir as any) || "asc",
          },
          customToolbar: () => (
            <FilterResetButton onClick={() => filterManager.resetFilter()} />
          ),
          onSearchChange: search => filterManager.changeSearch(search),
          onChangePage: page => filterManager.changePage(page),
          onChangeRowsPerPage: perPage => filterManager.changeRowsPerPage(perPage),
          onColumnSortChange: (changedColumn, dir) => {
            filterManager.changeColumnSort(changedColumn, dir);
          },
          onFilterChange: (column, filterList, type, index) => {
            filterManager.changeExtraFilter({
              [column as string]: filterList[index].length ? filterList[index][0] : null
            });
          },
        }}
      />
    </MuiThemeProvider>
  );
}

export default Table;